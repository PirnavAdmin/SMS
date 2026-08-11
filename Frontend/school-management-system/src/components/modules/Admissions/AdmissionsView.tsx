import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, Plus, Search, CheckCircle2, UserCheck,
  X, Eye, Edit, Trash2, ChevronLeft, ChevronRight, XCircle,
  ArrowLeft, Camera, User, Shield, Home, Bus, Calculator,
  Phone, Mail, MapPin, Calendar, Users, BookOpen, Heart, Info, FileText, Upload, ChevronDown
} from 'lucide-react';
import { AdmissionApplication, StudentType, Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { validate10DigitPhone, BLOOD_GROUPS, CASTE_CATEGORIES, BRANCHES } from '../../../utils/validation';
import { validateDOB } from '../../../utils/dateValidation';
import { formatCurrency } from '../../../utils/currency';
import { getHostelBlocks, getRooms, getRoomTypes, getAllocations, HostelBlock, HostelRoom, RoomType, BedAllocation } from '../../../api/hostel';

interface AdmissionsViewProps {
  onSelectStudentProfile?: (student: Student) => void;
  onNavigate?: (module: string) => void;
  initialFormOpen?: boolean;
}

export const AdmissionsView: React.FC<AdmissionsViewProps> = ({
  onNavigate,
  initialFormOpen
}) => {
  const {
    admissions, addAdmission, updateAdmission, deleteAdmission, updateAdmissionStatus, students,
    routeMasters, pickupPoints,
    getStudentFeeLedger, dynamicFeeStructures, financeTransportConfigs, hostelMasters, financeHostelConfigs,
    roomMasters, studentHostelAssignments, scholarships, discounts, roomTypeMasters, academicClasses,
    feeHeads
  } = useData();
  const { addToast } = useToast();
  const { selectedBranch } = useAuth();

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'regAsc' | 'regDesc' | 'nameAsc' | 'nameDesc' | 'classAsc' | 'classDesc'>('regDesc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // View States: Table View vs Full-Page Form View
  const [isFormView, setIsFormView] = useState(initialFormOpen || false);


  const handleCloseForm = () => {
    setIsFormView(false);
    if (onNavigate && initialFormOpen) {
      onNavigate('admissions');
    }
  };

  const [editingApp, setEditingApp] = useState<AdmissionApplication | null>(null);
  const [deletingApp, setDeletingApp] = useState<AdmissionApplication | null>(null);
  const [selectedAppForView, setSelectedAppForView] = useState<AdmissionApplication | null>(null);
  const [confirmingApp, setConfirmingApp] = useState<{ app: AdmissionApplication; status: AdmissionApplication['status'] } | null>(null);
  const [feeSummaryStudentId, setFeeSummaryStudentId] = useState<string | null>(null);

  // Dynamic Hostel States
  const [dynamicHostelBlocks, setDynamicHostelBlocks] = useState<HostelBlock[]>([]);
  const [dynamicHostelRooms, setDynamicHostelRooms] = useState<HostelRoom[]>([]);
  const [dynamicRoomTypes, setDynamicRoomTypes] = useState<RoomType[]>([]);
  const [dynamicAllocations, setDynamicAllocations] = useState<BedAllocation[]>([]);
  const [loadingHostels, setLoadingHostels] = useState(false);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addToast('info', 'Processing File', 'Reading Excel data...');
    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet) as any[];

          let count = 0;
          data.forEach(row => {
            if (row.applicantName || row.firstName || row.lastName) {
              const name = row.applicantName || `${row.firstName || ''} ${row.lastName || ''}`.trim();
              const newApp = {
                applicantName: name,
                appliedClass: row.appliedClass || 'Class 1',
                branch: row.branch || selectedBranch || 'Main Campus',
                parentName: row.parentName || row.fatherName || 'Not Provided',
                phone: row.phone || row.mobile || '',
                email: row.email || '',
                status: 'Pending',
                studentType: row.studentType || 'Day Scholar',
                submissionDate: new Date().toISOString()
              } as unknown as Omit<AdmissionApplication, 'id' | 'applicationNo'>;
              addAdmission(newApp);
              count++;
            }
          });
          
          addToast('success', 'Upload Complete', `Successfully imported ${count} admission records.`);
        } catch (err) {
          console.error(err);
          addToast('error', 'Upload Failed', 'Failed to parse Excel file.');
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      addToast('error', 'Error', 'Failed to load excel parser.');
    }
    e.target.value = '';
  };

  useEffect(() => {
    if (isFormView) {
      setLoadingHostels(true);
      Promise.all([
        getHostelBlocks(),
        getRooms(),
        getRoomTypes(),
        getAllocations()
      ]).then(([blocks, rooms, roomTypes, allocs]) => {
        setDynamicHostelBlocks(blocks);
        setDynamicHostelRooms(rooms);
        setDynamicRoomTypes(roomTypes);
        setDynamicAllocations(allocs);
      }).catch(err => {
        console.error("Failed to load dynamic hostel data:", err);
      }).finally(() => {
        setLoadingHostels(false);
      });
    }
  }, [isFormView]);

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [siblingSearchQuery, setSiblingSearchQuery] = useState('');
  const [isSiblingDropdownOpen, setIsSiblingDropdownOpen] = useState(false);
  const [isCustomCasteCategory, setIsCustomCasteCategory] = useState(false);
  const [hasSiblings, setHasSiblings] = useState(false);
  const [siblingStudentIds, setSiblingStudentIds] = useState<string[]>([]);

  const handleToggleSibling = (studentId: string) => {
    setSiblingStudentIds(prev => {
      const isPresent = prev.includes(studentId);
      const next = isPresent ? prev.filter(id => id !== studentId) : [...prev, studentId];
      setFormData(f => ({
        ...f,
        siblingStudentId: next[0] || '',
        siblingStudentIds: next,
        siblingsCount: Math.max(f.siblingsCount || 1, next.length)
      }));
      return next;
    });
  };

  const getSiblingTriggerText = () => {
    if (siblingStudentIds.length === 0) {
      if (formData.siblingStudentId) {
        const s = students.find(x => x.id === formData.siblingStudentId);
        return s ? `${s.firstName} ${s.lastName} (${s.className})` : 'Select Sibling';
      }
      return 'Select Sibling';
    }
    if (siblingStudentIds.length === 1) {
      const s = students.find(x => x.id === siblingStudentIds[0]);
      return s ? `${s.firstName} ${s.lastName} (${s.className})` : '1 Sibling Selected';
    }
    const selectedNames = siblingStudentIds
      .map(id => students.find(x => x.id === id))
      .filter(Boolean)
      .map(s => `${s?.firstName} ${s?.lastName}`)
      .join(', ');
    return `${siblingStudentIds.length} Siblings Selected (${selectedNames})`;
  };

  const [formData, setFormData] = useState<Partial<AdmissionApplication>>({
    appliedClass: '',
    gender: '' as any,
    dob: '',
    bloodGroup: '',
    religion: '',
    casteCategory: '',
    parentName: '',
    motherName: '',
    email: '',
    phone: '',
    addressHouseNo: '',
    addressStreet: '',
    addressArea: '',
    addressCity: '',
    addressDistrict: '',
    addressState: '',
    addressPinCode: '',
    siblingsCount: 0,
    siblingStudentId: '',
    studentType: '' as any,
    transportRequired: false,
    transportType: '' as any,
    busRoute: '',
    pickupPoint: '',
    hostelBlock: '',
    floor: '',
    hostelRoom: '',
    hostelBed: '',
      branch: selectedBranch,
      selectedOptionalFees: [],
      documentsSubmitted: []
  });



  // Sync isCustomCasteCategory state with casteCategory state
  useEffect(() => {
    if (formData.casteCategory) {
      if (formData.casteCategory === 'Others' || formData.casteCategory === 'Other') {
        setIsCustomCasteCategory(true);
      } else if (!CASTE_CATEGORIES.includes(formData.casteCategory as any)) {
        setIsCustomCasteCategory(true);
      } else {
        setIsCustomCasteCategory(false);
      }
    } else {
      setIsCustomCasteCategory(false);
    }
  }, [formData.casteCategory]);

  const filteredSiblingStudents = useMemo(() => {
    if (!siblingSearchQuery || siblingSearchQuery.includes('(')) {
      return students;
    }
    const q = siblingSearchQuery.toLowerCase();
    return students.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  }, [siblingSearchQuery, students]);

  const [phoneError, setPhoneError] = useState('');
  const [altPhoneError, setAltPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [photoError, setPhotoError] = useState('');

  const classOptions = academicClasses.map(cls => cls.name);

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
    const matchStatus = filterStatus === 'All' || (a.status || '').toLowerCase() === filterStatus.toLowerCase();
    return matchQuery && matchClass && matchStatus;
  });

  const sortedAdmissions = [...filteredAdmissions].sort((a, b) => {
    if (sortBy === 'regAsc') {
      return a.applicationNo.localeCompare(b.applicationNo, undefined, { numeric: true });
    }
    if (sortBy === 'regDesc') {
      return b.applicationNo.localeCompare(a.applicationNo, undefined, { numeric: true });
    }
    if (sortBy === 'nameAsc') {
      return a.applicantName.localeCompare(b.applicantName);
    }
    if (sortBy === 'nameDesc') {
      return b.applicantName.localeCompare(a.applicantName);
    }
    if (sortBy === 'classAsc') {
      return a.appliedClass.localeCompare(b.appliedClass, undefined, { numeric: true });
    }
    if (sortBy === 'classDesc') {
      return b.appliedClass.localeCompare(a.appliedClass, undefined, { numeric: true });
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedAdmissions.length / pageSize) || 1;
  const paginated = sortedAdmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingApp(null);
    setFirstName('');
    setLastName('');
    setAvatar('');
    setSiblingSearchQuery('');
    setIsSiblingDropdownOpen(false);
    setIsCustomCasteCategory(false);
    setHasSiblings(false);
    setSiblingStudentIds([]);
    setFormData({
      appliedClass: '',
      gender: '' as any,
      dob: '',
      bloodGroup: '',
      religion: '',
      casteCategory: '',
      parentName: '',
      motherName: '',
      email: '',
      phone: '',
      addressHouseNo: '',
      addressStreet: '',
      addressArea: '',
      addressCity: '',
      addressDistrict: '',
      addressState: '',
      addressPinCode: '',
      siblingsCount: 0,
      siblingStudentId: '',
      studentType: '' as any,
      transportRequired: false,
      transportType: '' as any,
      busRoute: '',
      pickupPoint: '',
      hostelBlock: '',
      floor: '',
      hostelRoom: '',
      hostelBed: '',
      branch: '',
      scholarshipId: '',
      discountId: '',
      selectedOptionalFees: [],
      documentsSubmitted: []
    });
    setPhoneError('');
    setDobError('');
    setPhotoError('');
    setIsFormView(true);
  };

  useEffect(() => {
    if (initialFormOpen) {
      handleOpenAdd();
    }
  }, [initialFormOpen]);

  const handleOpenEdit = (app: AdmissionApplication) => {
    setEditingApp(app);
    const parts = app.applicantName.split(' ');
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || '');
    setAvatar(app.avatar || '');
    
    let formattedDob = app.dob || '';
    if (formattedDob.includes('-') && formattedDob.split('-').length === 3) {
      const dParts = formattedDob.split('-');
      formattedDob = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
    }

    setFormData({ ...app, dob: formattedDob });
    setHasSiblings((app.siblingsCount && app.siblingsCount > 0) || !!app.siblingStudentId);
    setSiblingStudentIds(app.siblingStudentIds || (app.siblingStudentId ? [app.siblingStudentId] : []));
    setPhoneError('');
    setDobError('');
    setPhotoError('');
    setIsFormView(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setPhotoError('File limit exceeded (Max 2MB)');
        addToast('error', 'File Limit Exceeded', 'Student photo must be 2 MB or less.');
        return;
      }
      setPhotoError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        addToast('info', 'Photo Selected', 'Profile photo preview updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    setPhotoError('');
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

  const handleSubmit = (e: React.SyntheticEvent) => {
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

    let finalDob = formData.dob || '';
    if (finalDob.includes('-') && finalDob.split('-').length === 3) {
      const dParts = finalDob.split('-');
      finalDob = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
    }

    const dobValidation = validateDOB(finalDob);
    if (!dobValidation.isValid) {
      setDobError(dobValidation.error || 'Invalid DOB');
      addToast('error', 'DOB Validation Error', dobValidation.error);
      return;
    }

    const fullApplicantName = `${firstName.trim()} ${lastName.trim()}`;

    if (editingApp) {
      updateAdmission(editingApp.id, {
        ...formData,
        dob: finalDob,
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
        dob: finalDob || '15/08/2012',
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
        branch: formData.branch || selectedBranch || 'Main Campus',
        scholarshipId: formData.scholarshipId,
        discountId: formData.discountId,
        selectedOptionalFees: formData.selectedOptionalFees || [],
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        documentsSubmitted: formData.documentsSubmitted || []
      });

      addToast('success', 'Application Submitted', `Application registered for ${fullApplicantName}`);
    }

    handleCloseForm();
  };

  const isItemMandatory = (item: { feeHeadId: string; feeHeadName: string }) => {
    const fh = feeHeads.find(h => 
      h.id === item.feeHeadId || 
      h.id.replace('-0', '-') === item.feeHeadId ||
      h.id === item.feeHeadId.replace('-0', '-') ||
      h.name.toLowerCase() === item.feeHeadName.toLowerCase()
    );
    if (fh !== undefined && fh.mandatory !== undefined) {
      return fh.mandatory;
    }
    const lowerName = item.feeHeadName.toLowerCase();
    return (
      lowerName.includes('tuition') || 
      lowerName.includes('admission') || 
      lowerName.includes('book') || 
      lowerName.includes('textbook') || 
      lowerName.includes('stationery') ||
      lowerName.includes('material')
    );
  };

  const calculateLiveFeePreview = () => {
    if (!formData.appliedClass || formData.appliedClass === 'Select Class') {
      return { items: [], totalPayable: 0, isClassSelected: false };
    }

    const stType = formData.studentType || 'Day Scholar';
    const clsName = formData.appliedClass;

    const dfs = dynamicFeeStructures.find(d => d.className === clsName && d.status === 'Active') || dynamicFeeStructures.find(d => d.className === clsName) || dynamicFeeStructures[0];
    const baseItems = dfs ? dfs.items : [
      { feeHeadId: 'FH-01', feeHeadName: 'Tuition Fee', amount: 25000 },
      { feeHeadId: 'FH-02', feeHeadName: 'Admission Fee', amount: 5000 },
      { feeHeadId: 'FH-03', feeHeadName: 'Books & Stationery Fee', amount: 4500 },
      { feeHeadId: 'FH-04', feeHeadName: 'Uniform & Sports Kit Fee', amount: 3500 },
      { feeHeadId: 'FH-05', feeHeadName: 'Science & Computer Lab Fee', amount: 2500 }
    ];

    let items: { name: string; amount: number; isApplicable: boolean; remarks?: string }[] = [];

    baseItems.forEach(i => {
      const isMandatory = isItemMandatory(i);
      const isSelected = isMandatory || (formData.selectedOptionalFees || []).includes(i.feeHeadId);
      items.push({
        name: i.feeHeadName,
        amount: i.amount,
        isApplicable: isSelected,
        remarks: isSelected ? undefined : 'Optional Fee Not Selected'
      });
    });

    if (stType === 'Day Scholar' || stType === 'Non-Residential') {
      const isTransportSelected = formData.transportRequired && formData.busRoute && formData.pickupPoint;
      if (isTransportSelected) {
        const rObj = routeMasters.find(r => r.id === formData.routeId || r.routeName === formData.busRoute);
        const pObj = pickupPoints.find(p => p.id === formData.pickupPointId || (rObj && p.routeId === rObj.id && p.pickupName === formData.pickupPoint));
        const ftc = financeTransportConfigs.find(
          c => (c.routeId === rObj?.id) && (c.pickupPointId === pObj?.id || c.pickupName === pObj?.pickupName) && c.status === 'Active'
        ) || financeTransportConfigs[0];

        const trpFee = ftc ? ftc.feeAmount : 5500;
        items.push({
          name: `Transport Fee (${rObj?.routeName || formData.busRoute})`,
          amount: trpFee,
          isApplicable: true
        });
      } else {
        items.push({
          name: 'Transport Fee',
          amount: 0,
          isApplicable: false,
          remarks: formData.transportRequired ? 'Pickup Point Not Selected' : 'Transport Not Opted'
        });
      }

      items.push({
        name: 'Hostel Fee',
        amount: 0,
        isApplicable: false,
        remarks: 'Not Applicable for Day Scholars'
      });
    } else {
      const isHostelSelected = formData.hostelBlock && formData.hostelRoom && formData.hostelBed;
      if (isHostelSelected) {
        const hObj = hostelMasters.find(h => h.id === formData.hostelBlock || h.hostelName === formData.hostelBlock || h.id.toString() === formData.hostelBlock?.toString()) || hostelMasters[0];
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
      } else {
        items.push({
          name: 'Hostel Fee',
          amount: 0,
          isApplicable: false,
          remarks: 'Hostel Bed Not Allocated'
        });
        items.push({
          name: 'Security Deposit',
          amount: 0,
          isApplicable: false,
          remarks: 'Hostel Bed Not Allocated'
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

    // Sort items so active applicable fees appear at top, and unselected optional/non-applicable fees appear at bottom
    items.sort((a, b) => {
      if (a.isApplicable === b.isApplicable) return 0;
      return a.isApplicable ? -1 : 1;
    });

    const totalPayable = items.reduce((acc, i) => acc + (i.isApplicable ? i.amount : 0), 0);

    return { items, totalPayable, isClassSelected: true };
  };

  // FULL-PAGE APPLICATION FORM VIEW
  if (isFormView) {
    return (
      <div className="space-y-2 animate-in fade-in max-w-6xl mx-auto pb-12">
        {/* Full Page Header Navigation */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseForm}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Back to Directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
               <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                {editingApp ? `Edit Application #${editingApp.applicationNo}` : 'New Student Registration'}
              </h2>
            </div>
          </div>
        </div>

        {/* Full Page Layout with Sticky Live Fee Preview Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Admission Form */}
          <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-slate-900 dark:text-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">

            {/* Section 1: Student Details */}
            <div className="space-y-4">
              <div className="border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> 1. Student Details
                </h4>
              </div>

              {/* Section 1 Grid: Form Fields (Left 10 cols) + Photo Upload (Right 2 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Left 10 Cols: Form Inputs */}
                <div className="lg:col-span-10 space-y-3">
                  
                  {/* First Name & Last Name */}
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

                  {/* Class, Gender, Campus */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class *</label>
                      <div className="relative">
                        <select
                          value={formData.appliedClass}
                          onChange={e => setFormData({ ...formData, appliedClass: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="">Select Class</option>
                          {classOptions.map(className => (
                            <option key={className} value={className}>{className}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender *</label>
                      <div className="relative">
                        <select
                          value={formData.gender}
                          onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Campus *</label>
                      <div className="relative">
                        <select
                          value={formData.branch}
                          onChange={e => setFormData({ ...formData, branch: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="">Select Campus</option>
                          {BRANCHES.map(branch => (
                            <option key={branch} value={branch}>{branch}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 2 Cols: Photo Upload (Top-aligned with First Name label, Bottom-aligned with Campus input) */}
                <div className="lg:col-span-2 flex flex-col items-center justify-between h-[120px] pt-0 shrink-0">
                  <div className="relative shrink-0">
                    {avatar ? (
                      <div className="relative">
                        <img
                          src={avatar}
                          alt="Applicant Photo Preview"
                          className="w-20 h-[78px] rounded-xl object-cover ring-2 ring-brand-500/20 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 shadow-xs border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-[78px] rounded-xl bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-100/50 dark:ring-slate-800/50 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {photoError ? (
                    <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 tracking-tight text-center animate-in fade-in">
                      {photoError}
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-tight text-center">Max size: 2MB</span>
                  )}

                  {!avatar ? (
                    <label className="w-20 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-extrabold cursor-pointer flex items-center justify-center gap-1 shadow-xs transition-all shrink-0">
                      <Camera className="w-3.5 h-3.5" /> Upload
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  ) : (
                    <label className="w-20 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-all shrink-0">
                      <Camera className="w-3 h-3" /> Change
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>

              </div>

              {/* DOB, Blood Group, Religion, Caste Category */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                <div className="sm:col-span-3">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob ? formData.dob.split('/').reverse().join('-') : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val) {
                        const parts = val.split('-');
                        if (parts.length === 3) {
                          handleDOBChange(`${parts[2]}/${parts[1]}/${parts[0]}`);
                          return;
                        }
                      }
                      handleDOBChange('');
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                      dobError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {dobError && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{dobError}</p>}
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Blood Group *</label>
                  <div className="relative">
                    <select
                      value={formData.bloodGroup}
                      onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                    >
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Religion</label>
                  <input
                    type="text"
                    placeholder="e.g. Christianity"
                    value={formData.religion}
                    onChange={e => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Caste *</label>
                  {isCustomCasteCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Specify Caste (Clear to cancel)"
                      value={formData.casteCategory === 'Others' || formData.casteCategory === 'Other' ? '' : formData.casteCategory}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, casteCategory: val });
                        if (!val) {
                          setIsCustomCasteCategory(false);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.casteCategory}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Others' || val === 'Other') {
                            setIsCustomCasteCategory(true);
                            setFormData({ ...formData, casteCategory: 'Others' });
                          } else {
                            setFormData({ ...formData, casteCategory: val });
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                      >
                        <option value="">Select Caste</option>
                        {CASTE_CATEGORIES.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Parent & Guardian Details */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> 2. Parent Information
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
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">1. Father Mobile *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                      phoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {phoneError && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{phoneError}</p>}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">2. Mother Mobile</label>
                  <input
                    type="text"
                    value={formData.motherPhone || ''}
                    onChange={e => setFormData({ ...formData, motherPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">3. Alternate Mobile</label>
                  <input
                    type="text"
                    value={formData.alternatePhone || ''}
                    onChange={e => handleAltPhoneChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                      altPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {altPhoneError && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{altPhoneError}</p>}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">4. Email Address</label>
                  <input
                    type="text"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Address Breakdown */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Home className="w-4 h-4" /> 3. Residential Address
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
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 4. Sibling Information
              </h4>

              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Existing Sibling(s) Enrolled in School?
                  </span>
                  <div className="flex gap-4 font-bold text-xs text-slate-900 dark:text-white">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                      <input
                        type="radio"
                        name="hasSiblingsRadio"
                        checked={hasSiblings === true}
                        onChange={() => {
                          setHasSiblings(true);
                          if (!formData.siblingsCount) {
                            setFormData(prev => ({ ...prev, siblingsCount: 1 }));
                          }
                        }}
                        className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                      <input
                        type="radio"
                        name="hasSiblingsRadio"
                        checked={hasSiblings === false}
                        onChange={() => {
                          setHasSiblings(false);
                          setFormData(prev => ({ ...prev, siblingsCount: 0, siblingStudentId: '' }));
                          setSiblingSearchQuery('');
                          setIsSiblingDropdownOpen(false);
                        }}
                        className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                      />
                      No
                    </label>
                  </div>
                </div>

                {hasSiblings && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-sky-100 dark:border-sky-900/40">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Number of Siblings</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 1"
                        value={formData.siblingsCount === undefined || formData.siblingsCount === 0 ? '' : formData.siblingsCount}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '') {
                            setFormData(prev => ({ ...prev, siblingsCount: 0 }));
                          } else {
                            const parsed = parseInt(val, 10);
                            setFormData(prev => ({ ...prev, siblingsCount: isNaN(parsed) ? 0 : Math.max(0, parsed) }));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Existing Student Sibling (Optional)</label>
                      <div className="relative">
                        {/* Trigger Button */}
                        <div
                          onClick={() => setIsSiblingDropdownOpen(!isSiblingDropdownOpen)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none text-xs cursor-pointer flex justify-between items-center pr-10"
                        >
                          <span className="truncate">
                            {getSiblingTriggerText()}
                          </span>
                        </div>
                        {siblingStudentIds.length > 0 || formData.siblingStudentId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSiblingStudentIds([]);
                              setFormData(prev => ({ ...prev, siblingStudentId: '', siblingStudentIds: [] }));
                              setSiblingSearchQuery('');
                              setIsSiblingDropdownOpen(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
                            title="Clear Sibling Selection"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}

                        {/* Dropdown Card */}
                        {isSiblingDropdownOpen && (
                          <>
                            {/* Click away backdrop */}
                            <div className="fixed inset-0 z-40" onClick={() => setIsSiblingDropdownOpen(false)} />
                            
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-2">
                              {/* Search bar inside the dropdown */}
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Type student name to search..."
                                  value={siblingSearchQuery}
                                  onChange={e => setSiblingSearchQuery(e.target.value)}
                                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                                />
                              </div>

                              {/* Filtered list with checkboxes */}
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                <div
                                  onClick={() => {
                                    setSiblingStudentIds([]);
                                    setFormData(prev => ({ ...prev, siblingStudentId: '', siblingStudentIds: [] }));
                                    setIsSiblingDropdownOpen(false);
                                    setSiblingSearchQuery('');
                                  }}
                                  className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-md text-slate-500 font-bold text-xs"
                                >
                                  Clear Selection
                                </div>
                                {filteredSiblingStudents.map(s => {
                                  const isChecked = siblingStudentIds.includes(s.id) || formData.siblingStudentId === s.id;
                                  return (
                                    <div
                                      key={s.id}
                                      onClick={() => handleToggleSibling(s.id)}
                                      className={`px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg text-xs font-bold flex items-center gap-2.5 transition-colors ${
                                        isChecked ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}}
                                        className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <span className="truncate block font-bold">{s.firstName} {s.lastName}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">Class {s.className} • Reg: {s.admissionNo || 'Enrolled'}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                                {filteredSiblingStudents.length === 0 && (
                                  <div className="px-2.5 py-2.5 text-slate-500 text-center text-xs font-medium">
                                    No matching students found
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Student Type (Conditional Day Scholar vs Hosteller) */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> 5. Student Type & Residential Allocation
              </h4>
              <div className="w-full">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Student Type *</label>
                  <div className="relative">
                    <select
                      value={formData.studentType || ''}
                      onChange={e => setFormData({ ...formData, studentType: e.target.value as StudentType })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                    >
                      <option value="">Select Type</option>
                      <option value="Non-Residential">Non-Residential</option>
                      <option value="Residential">Residential</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Conditional Rendering for Non-Residential */}
              {(formData.studentType === 'Non-Residential' || formData.studentType === 'Day Scholar') && (
                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">School Transport Facility Required?</span>
                    <div className="flex gap-4 font-bold text-xs text-slate-900 dark:text-white">
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                        <input type="radio" name="trans" checked={formData.transportRequired === true} onChange={() => setFormData({ ...formData, transportRequired: true })} className="w-4 h-4 text-sky-600 focus:ring-sky-500" /> Yes (School Bus)
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                        <input type="radio" name="trans" checked={formData.transportRequired === false || !formData.transportRequired} onChange={() => setFormData({ ...formData, transportRequired: false })} className="w-4 h-4 text-sky-600 focus:ring-sky-500" /> No (Self Transport)
                      </label>
                    </div>
                  </div>

                  {formData.transportRequired && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bus Route (Transport Master)</label>
                        <div className="relative">
                          <select
                            value={formData.busRoute}
                            onChange={e => {
                              const rName = e.target.value;
                              setFormData({
                                ...formData,
                                busRoute: rName,
                                pickupPoint: ''
                              });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                          >
                            <option value="">Select Route</option>
                            {routeMasters.map(r => <option key={r.id} value={r.routeName}>{r.routeName} ({r.routeCode})</option>)}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Pickup Point</label>
                        <div className="relative">
                          <select
                            value={formData.pickupPoint}
                            onChange={e => setFormData({ ...formData, pickupPoint: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                          >
                            <option value="">Select Stop</option>
                            {pickupPoints
                              .filter(p => p.routeName === formData.busRoute || p.routeId === routeMasters.find(r => r.routeName === formData.busRoute)?.id)
                              .map(p => (
                                <option key={p.id} value={p.pickupName}>{p.sequenceNumber}. {p.pickupName} ({p.arrivalTime})</option>
                              ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Rendering for Residential (Available Rooms & Beds Only) */}
              {(formData.studentType === 'Residential' || formData.studentType === 'Hosteller') && (
                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                  <h5 className="font-bold text-sky-900 dark:text-sky-200">Hostel Bed Allocation</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Block</label>
                      <div className="relative">
                        <select
                          value={formData.hostelBlock}
                          onChange={e => {
                            setFormData({
                              ...formData,
                              hostelBlock: e.target.value,
                              hostelRoom: '',
                              hostelBed: ''
                            });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="">Select Hostel Block</option>
                          {dynamicHostelBlocks.map(b => <option key={b.hostelId} value={b.hostelId}>{b.hostelName} ({b.hostelType})</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Room</label>
                      <div className="relative">
                        <select
                          value={formData.hostelRoom}
                          onChange={e => {
                            setFormData({
                              ...formData,
                              hostelRoom: e.target.value,
                              hostelBed: ''
                            });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="">Select Room</option>
                          {dynamicHostelRooms
                            .filter(r => r.hostelId.toString() === formData.hostelBlock)
                            .map(r => {
                              const rtObj = dynamicRoomTypes.find(rt => rt.roomTypeId === r.roomTypeId);
                              const rCap = rtObj ? rtObj.bedCapacity : (r.bedCapacity || 2);
                              const rName = rtObj ? rtObj.roomTypeSpecification : (r.roomTypeSpecification || 'Standard Room');
                              const acLabel = rtObj?.acType || 'Non-AC';
                              const occupied = dynamicAllocations.filter(a => a.roomId === r.roomId && a.status === 'Active').length;
                              return (
                                <option key={r.roomId} value={r.roomId} disabled={occupied >= rCap}>
                                  Room #{r.roomNumber} ({rName} - {acLabel}) {occupied >= rCap ? '[FULLY OCCUPIED]' : ''}
                                </option>
                              );
                            })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {(() => {
                        const selRoom = dynamicHostelRooms.find(r => r.roomId.toString() === formData.hostelRoom);
                        if (selRoom) {
                          const rtObj = dynamicRoomTypes.find(rt => rt.roomTypeId === selRoom.roomTypeId);
                          const rCap = rtObj ? rtObj.bedCapacity : (selRoom.bedCapacity || 2);
                          const occupied = dynamicAllocations.filter(a => a.roomId === selRoom.roomId && a.status === 'Active').length;
                          const avail = Math.max(0, rCap - occupied);
                          return (
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">
                              Occupancy: <span className="text-sky-600 dark:text-sky-400 font-extrabold">{occupied} / {rCap}</span> Beds ({avail} Bed{avail !== 1 ? 's' : ''} Available) {avail === 0 && <span className="text-rose-500 font-black ml-1">[Fully Occupied]</span>}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Bed</label>
                      <div className="relative">
                        <select
                          value={formData.hostelBed}
                          onChange={e => setFormData({ ...formData, hostelBed: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 outline-none animate-in fade-in appearance-none cursor-pointer pr-10"
                        >
                          <option value="">Select Bed</option>
                          {formData.hostelRoom && (() => {
                            const selRoom = dynamicHostelRooms.find(r => r.roomId.toString() === formData.hostelRoom);
                            const rtObj = selRoom ? dynamicRoomTypes.find(rt => rt.roomTypeId === selRoom.roomTypeId) : null;
                            const rCap = rtObj ? rtObj.bedCapacity : (selRoom ? (selRoom.bedCapacity || 2) : 2);
                            const beds = Array.from({ length: rCap }, (_, idx) => `BED-${idx + 1}`);

                            return beds.map(bed => {
                              const isTaken = dynamicAllocations.some(
                                a => a.roomId.toString() === formData.hostelRoom && a.bedNumber === bed && a.status === 'Active'
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
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Financial Benefits Section */}
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                <h5 className="font-bold text-sky-900 dark:text-sky-200">Financial Benefits</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Scholarship</label>
                    <div className="relative">
                      <select
                        value={formData.scholarshipId || ''}
                        onChange={e => setFormData({ ...formData, scholarshipId: e.target.value || undefined })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                      >
                        <option value="">None</option>
                        {scholarships.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.discountType === 'Percentage' ? `${s.percentage}%` : formatCurrency(s.fixedAmount || 0)})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Discount</label>
                    <div className="relative">
                      <select
                        value={formData.discountId || ''}
                        onChange={e => setFormData({ ...formData, discountId: e.target.value || undefined })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                      >
                        <option value="">None</option>
                        {discounts.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.mode === 'Percentage' ? `${d.value}%` : formatCurrency(d.value)})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Fee Head Selection */}
              {(() => {
                const clsName = formData.appliedClass || 'Class 10';
                const dfs = dynamicFeeStructures.find(d => d.className === clsName && d.status === 'Active') || dynamicFeeStructures[0];
                const baseItems = dfs ? dfs.items : [
                  { feeHeadId: 'FH-01', feeHeadName: 'Tuition Fee', amount: 25000 },
                  { feeHeadId: 'FH-02', feeHeadName: 'Admission Fee', amount: 5000 },
                  { feeHeadId: 'FH-03', feeHeadName: 'Books & Stationery Fee', amount: 4500 },
                  { feeHeadId: 'FH-04', feeHeadName: 'Uniform & Sports Kit Fee', amount: 3500 },
                  { feeHeadId: 'FH-05', feeHeadName: 'Science & Computer Lab Fee', amount: 2500 }
                ];
                
                const optionalItems = baseItems.filter(item => !isItemMandatory(item));

                if (optionalItems.length === 0) return null;

                return (
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                    <h5 className="font-bold text-sky-900 dark:text-sky-200">Optional Fee Selection</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Select any optional fee types to apply for this student:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {optionalItems.map(item => {
                        const isChecked = (formData.selectedOptionalFees || []).includes(item.feeHeadId);
                        return (
                          <label key={item.feeHeadId} className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const currentSelected = formData.selectedOptionalFees || [];
                                const updated = isChecked
                                  ? currentSelected.filter(id => id !== item.feeHeadId)
                                  : [...currentSelected, item.feeHeadId];
                                setFormData({ ...formData, selectedOptionalFees: updated });
                              }}
                              className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                            />
                            <div>
                              <span className="block font-bold text-slate-900 dark:text-white text-xs">{item.feeHeadName}</span>
                              <span className="block text-[10px] text-slate-500">{formatCurrency(item.amount)}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg shadow-brand-500/20 transition-all"
              >
                {editingApp ? 'Save Application Changes' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Column: Sticky Live Fee Preview Panel */}
        {(() => {
          const liveFee = calculateLiveFeePreview();
          return (
            <div className="lg:col-span-1 glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-850 shadow-xl sticky top-20 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Applicable Fees
                  </h3>
                </div>
                {liveFee.isClassSelected && (
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold text-[10px] border border-sky-200 dark:border-sky-800">
                    {formData.appliedClass} • {formData.studentType || 'Day Scholar'}
                  </span>
                )}
              </div>

              {!liveFee.isClassSelected ? (
                <div className="py-6 px-3 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-slate-700">
                    <Calculator className="w-5 h-5 animate-pulse text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Select Class for Fee Structure</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px] mx-auto">
                      Select a class from the form to view tuition, transport, hostel & optional fee calculations.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Line Items */}
                  <div className="space-y-2 text-xs">
                    {liveFee.items.filter(item => item.isApplicable).map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex justify-between py-1.5 px-2.5 rounded-xl transition-all"
                      >
                        <span className="font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[170px]">{item.name}</span>
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Summary */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                    <p className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-400 tracking-wider">Total Estimated Payable</p>
                    <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-300">{formatCurrency(liveFee.totalPayable)}</h4>
                  </div>
                </>
              )}
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
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> Admissions
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex py-2 px-4 items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Upload Excel
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleBulkUpload} />
          </label>
          <button
            onClick={handleOpenAdd}
            className="inline-flex py-2 px-4 items-center gap-2 rounded-xl bg-sky-600 text-[11px] font-black text-white hover:bg-sky-700 shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" /> New Admission
          </button>
        </div>
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
            <span className="text-[11px] font-bold text-slate-400">Class:</span>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Classes</option>
              {Array.from(new Set(admissions.map(a => a.appliedClass))).sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
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
              {Array.from(new Set([
                'Pending',
                'Enrolled',
                'Rejected',
                ...admissions.map(a => {
                  const s = (a.status || 'Pending').trim();
                  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                })
              ]))
                .filter(s => s !== 'Deleted')
                .sort()
                .map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="regDesc">Latest Admissions</option>
              <option value="regAsc">Oldest Admissions</option>
              <option value="nameAsc">Student Name (A-Z)</option>
              <option value="nameDesc">Student Name (Z-A)</option>
              <option value="classAsc">Class (Low to High)</option>
              <option value="classDesc">Class (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table Format View */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Application Reg No</th>
                <th className="py-3.5 px-4">Applicant Student</th>
                <th className="py-3.5 px-4">Applied Class</th>
                <th className="py-3.5 px-4">Student Type</th>
                <th className="py-3.5 px-4">Father Contact</th>
                <th className="py-3.5 px-4 text-center">Actions & Enrollment</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500">No matching admission applications found.</td></tr>
              ) : (
                paginated.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{app.applicationNo}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {app.avatar ? (
                          <img src={app.avatar} alt="" className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{app.applicantName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{app.appliedClass}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">{app.studentType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 dark:text-slate-200">{app.parentName}</p>
                      <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 font-mono">{app.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4">
            
            {/* Header with SMS Brand Gradient */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600 dark:from-slate-850 dark:via-slate-900 dark:to-slate-950 text-white relative overflow-hidden shrink-0">
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedAppForView.avatar ? (
                    <img 
                      src={selectedAppForView.avatar} 
                      alt={selectedAppForView.applicantName} 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40 shadow-md shrink-0 bg-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        {selectedAppForView.applicantName}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-xs ${
                        selectedAppForView.status === 'Enrolled' ? 'bg-emerald-500/25 border-emerald-300/40 text-emerald-100' :
                        selectedAppForView.status === 'Rejected' ? 'bg-rose-500/25 border-rose-300/40 text-rose-100' :
                        selectedAppForView.status === 'Approved' ? 'bg-blue-500/25 border-blue-300/40 text-blue-100' :
                        selectedAppForView.status === 'Verified' ? 'bg-amber-500/25 border-amber-300/40 text-amber-100' :
                        'bg-white/20 border-white/30 text-white'
                      }`}>
                        {selectedAppForView.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-white/90 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-white/80" /> App No: <span className="font-bold font-mono text-white">{selectedAppForView.applicationNo}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-white/80" /> Class: <span className="font-bold text-white">{selectedAppForView.appliedClass}</span>
                      </span>
                      {selectedAppForView.branch && (
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5 hidden sm:inline-flex">
                          <MapPin className="w-3.5 h-3.5 text-white/80" /> {selectedAppForView.branch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedAppForView(null)} 
                  className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 shadow-sm backdrop-blur-xs transition-colors shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subtle background decorative shapes */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute left-1/2 -top-10 w-40 h-40 rounded-full bg-brand-400/20 blur-2xl pointer-events-none" />
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-950/40 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Personal Details */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <Info className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Personal Details
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Date of Birth</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedAppForView.dob || 'Not provided'}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Gender</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedAppForView.gender || 'Not specified'}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Blood Group</p>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-rose-500/20 text-rose-500" /> {selectedAppForView.bloodGroup || 'N/A'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Religion & Caste</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={`${selectedAppForView.religion || 'General'} - ${selectedAppForView.casteCategory || 'General'}`}>
                        {selectedAppForView.religion || 'General'} • {selectedAppForView.casteCategory || 'General'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Parent / Guardian Details */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <Users className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Parent / Guardian Details
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Father's Name</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedAppForView.parentName || 'Not provided'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Primary Phone</p>
                        <a href={`tel:${selectedAppForView.phone}`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">
                          <Phone className="w-3 h-3" /> {selectedAppForView.phone || 'N/A'}
                        </a>
                      </div>
                    </div>

                    {selectedAppForView.motherName && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mother's Name</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedAppForView.motherName}</p>
                        </div>
                        {selectedAppForView.motherPhone && (
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mother's Phone</p>
                            <a href={`tel:${selectedAppForView.motherPhone}`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                              {selectedAppForView.motherPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedAppForView.email && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</p>
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">{selectedAppForView.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Transport & Accommodation */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    {(selectedAppForView.studentType === 'Hosteller' || selectedAppForView.studentType === 'Residential') ? (
                      <Home className="w-4 h-4 text-brand-500" />
                    ) : (
                      <Bus className="w-4 h-4 text-brand-500" />
                    )}
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Transport & Accommodation
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Student Type</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold">
                        {selectedAppForView.studentType || 'Day Scholar'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Campus</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedAppForView.branch || 'Main Campus'}</p>
                    </div>
                  </div>

                  {(selectedAppForView.studentType === 'Day Scholar' || selectedAppForView.studentType === 'Non-Residential' || !selectedAppForView.studentType) && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Transport Service</p>
                      {selectedAppForView.transportRequired ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Bus className="w-3.5 h-3.5 text-emerald-500" /> Route: {selectedAppForView.busRoute || 'Assigned Route'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Stop: {selectedAppForView.pickupPoint || 'Pending allocation'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Self Commute / Transport Not Opted</p>
                      )}
                    </div>
                  )}

                  {(selectedAppForView.studentType === 'Hosteller' || selectedAppForView.studentType === 'Residential') && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Hostel Allocation</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-brand-500" /> 
                        {selectedAppForView.hostelBlock ? `${selectedAppForView.hostelBlock} - Room ${selectedAppForView.hostelRoom || 'N/A'}${selectedAppForView.hostelBed ? ` (Bed ${selectedAppForView.hostelBed})` : ''}` : 'Pending allocation'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Residential Address */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Residential Address
                      </h4>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      {selectedAppForView.addressHouseNo || selectedAppForView.addressStreet || selectedAppForView.addressCity ? (
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {[
                            selectedAppForView.addressHouseNo,
                            selectedAppForView.addressStreet,
                            selectedAppForView.addressArea,
                            selectedAppForView.addressCity,
                            selectedAppForView.addressDistrict,
                            selectedAppForView.addressState
                          ].filter(Boolean).join(', ')}
                          {selectedAppForView.addressPinCode && ` - ${selectedAppForView.addressPinCode}`}
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-400 dark:text-slate-500">
                          No address details recorded for this student.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submission date tag */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Submitted:</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">{selectedAppForView.submissionDate || 'N/A'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer with Neat Layout & Action Buttons */}
            <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Application <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{selectedAppForView.applicationNo}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const appToEdit = selectedAppForView;
                    setSelectedAppForView(null);
                    handleOpenEdit(appToEdit);
                  }}
                  className="px-4 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/40 border border-brand-200 dark:border-brand-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Application
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedAppForView(null)} 
                  className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
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
        onConfirm={async () => {
          if (confirmingApp) {
            const studentId = await updateAdmissionStatus(confirmingApp.app.id, confirmingApp.status);
            if (confirmingApp.status === 'Enrolled') {
              if (studentId) {
                setFeeSummaryStudentId(studentId);
              } else {
                const matchedSt = students.find(s => s.admissionNo === confirmingApp.app.applicationNo || s.phone === confirmingApp.app.phone);
                if (matchedSt) {
                  setFeeSummaryStudentId(matchedSt.id);
                } else {
                  setFeeSummaryStudentId(students[0]?.id || 'STU-001');
                }
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
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Fee Types</h4>
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
