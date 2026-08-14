import React, { useState, useEffect } from 'react';
import { X, UserCheck, User, Shield, Bus, Camera, Trash2, Home, Users, Search, ChevronDown } from 'lucide-react';
import { Student, StudentType, SiblingDetail } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { validateDOB, formatToDDMMYYYY, formatToISO } from '../../../utils/dateValidation';
import { validate10DigitPhone, BLOOD_GROUPS, CASTE_CATEGORIES, BRANCHES } from '../../../utils/validation';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  studentToEdit
}) => {
  const { addStudent, updateStudent, students, transportRoutes, hostelBlocks, hostelRooms, hostelBeds, academicClasses } = useData();
  const { addToast } = useToast();

  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dob: '15/08/2012',
    bloodGroup: 'O+',
    religion: 'General',
    casteCategory: 'General',
    className: academicClasses[0]?.name || 'Class 9',
    section: '',
    category: 'General',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    joiningDate: new Date().toISOString().split('T')[0],
    isLateAdmission: false,
    feeCalculationMethod: 'Term-wise',
    branch: 'Main Campus',
    studentType: 'Day Scholar',
    busRoute: transportRoutes[0]?.routeName || 'Route A - North Suburbs',
    transportType: 'AC',
    pickupPoint: 'North Suburbs Stop 4',
    dropPoint: 'Academy Main Gate',
    hostelBlock: hostelBlocks[0]?.id || '',
    hostelRoom: hostelRooms[0]?.id || '',
    hostelBed: '',
    boardType: 'CBSE',
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: 'Business',
    motherName: '',
    motherPhone: '',
    email: '',
    phone: '',
    address: '',
    siblingsCount: 0,
    totalFee: 4500,
    paidFee: 0,
    dueFee: 4500,
    attendancePct: 100,
    gpa: 4.0,
    admissionNo: 'ADM2026-' + Math.floor(100 + Math.random() * 900),
    rollNo: '10' + Math.floor(10 + Math.random() * 90)
  });

  // Separate address breakdown for editing match
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('New York');
  const [district, setDistrict] = useState('Knowledge City');
  const [stateName, setStateName] = useState('NY');
  const [pinCode, setPinCode] = useState('10001');

  const [dobError, setDobError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [isMidYearFeeModalOpen, setIsMidYearFeeModalOpen] = useState(false);

  const [hasSiblings, setHasSiblings] = useState<boolean>(false);
  const [siblingsCount, setSiblingsCount] = useState<number>(1);
  const [siblingDetails, setSiblingDetails] = useState<SiblingDetail[]>([]);
  const [activeSiblingDropdownIdx, setActiveSiblingDropdownIdx] = useState<number | null>(null);
  const [siblingSearchQuery, setSiblingSearchQuery] = useState<string>('');

  const hasExistingEnrolledSibling = Boolean(
    hasSiblings && siblingDetails.some((d) => d.isExisting && Boolean(d.studentId))
  );

  const handleHasSiblingsChange = (val: boolean) => {
    setHasSiblings(val);
    if (val) {
      const count = siblingsCount >= 1 ? siblingsCount : 1;
      setSiblingsCount(count);
      setSiblingDetails((prev) => {
        if (prev.length >= count) {
          return prev.slice(0, count);
        }
        const newEntries = [...prev];
        while (newEntries.length < count) {
          newEntries.push({ name: '', isExisting: false });
        }
        return newEntries;
      });
      setFormData((prev) => ({
        ...prev,
        hasSiblings: true,
        siblingsCount: count,
      }));
    } else {
      setSiblingsCount(0);
      setSiblingDetails([]);
      setActiveSiblingDropdownIdx(null);
      setFormData((prev) => ({
        ...prev,
        hasSiblings: false,
        siblingsCount: 0,
        siblingDetails: [],
        siblingStudentId: '',
        siblingStudentIds: [],
      }));
    }
  };

  const handleSiblingsCountChange = (valStr: string) => {
    if (valStr === '') {
      setSiblingsCount(0);
      return;
    }
    let num = parseInt(valStr, 10);
    if (isNaN(num) || num < 0) {
      num = 0;
    }
    setSiblingsCount(num);
    if (num > 0) {
      setSiblingDetails((prev) => {
        if (prev.length === num) return prev;
        if (prev.length > num) {
          return prev.slice(0, num);
        }
        const newEntries = [...prev];
        while (newEntries.length < num) {
          newEntries.push({ name: '', isExisting: false });
        }
        return newEntries;
      });
      setFormData((prev) => ({
        ...prev,
        siblingsCount: num,
      }));
    }
  };

  const handleSiblingIsExistingChange = (idx: number, isExisting: boolean) => {
    setSiblingDetails((prev) => {
      const next = [...prev];
      const curr = next[idx] || { name: '', isExisting: false };
      if (!isExisting) {
        next[idx] = {
          ...curr,
          isExisting: false,
          studentId: undefined,
          admissionNo: undefined,
          name: curr.studentId ? '' : curr.name,
        };
      } else {
        next[idx] = {
          ...curr,
          isExisting: true,
        };
      }
      return next;
    });
  };

  const handleSiblingNameChange = (idx: number, nameVal: string) => {
    setSiblingDetails((prev) => {
      const next = [...prev];
      next[idx] = {
        ...(next[idx] || { isExisting: false }),
        name: nameVal,
      };
      return next;
    });
  };

  const handleSelectExistingStudent = (idx: number, selectedStudent: Student) => {
    const isAlreadyChosen = siblingDetails.some(
      (item, i) => i !== idx && item.studentId === selectedStudent.id
    );
    if (isAlreadyChosen) {
      addToast('warning', 'Already Selected', `${selectedStudent.firstName} ${selectedStudent.lastName} is already selected as a sibling.`);
      return;
    }

    const existingCountOtherSlots = siblingDetails.filter(
      (item, i) => i !== idx && item.isExisting && item.studentId
    ).length;

    if (existingCountOtherSlots + 1 > siblingsCount) {
      addToast('warning', 'Limit Reached', `You can select a maximum of ${siblingsCount} siblings.`);
      return;
    }

    const sName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
    setSiblingDetails((prev) => {
      const next = [...prev];
      next[idx] = {
        id: selectedStudent.id,
        name: sName,
        isExisting: true,
        studentId: selectedStudent.id,
        admissionNo: selectedStudent.admissionNo,
      };
      return next;
    });
    setActiveSiblingDropdownIdx(null);
    setSiblingSearchQuery('');
  };

  const availableBeds = hostelBeds.filter(b => b.status === 'Available');

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        ...studentToEdit,
        isLateAdmission: !!studentToEdit.isLateAdmission,
        feeCalculationMethod: studentToEdit.feeCalculationMethod || 'Term-wise',
        dob: formatToDDMMYYYY(studentToEdit.dob)
      });
      const hasSib = studentToEdit.hasSiblings ?? ((studentToEdit.siblingsCount && studentToEdit.siblingsCount > 0) || !!studentToEdit.siblingStudentId || (studentToEdit.siblingDetails && studentToEdit.siblingDetails.length > 0));
      setHasSiblings(!!hasSib);
      const count = studentToEdit.siblingsCount && studentToEdit.siblingsCount > 0 ? studentToEdit.siblingsCount : (studentToEdit.siblingDetails?.length || 1);
      setSiblingsCount(count);

      if (studentToEdit.siblingDetails && studentToEdit.siblingDetails.length > 0) {
        setSiblingDetails(studentToEdit.siblingDetails);
      } else if (hasSib) {
        const sIds = studentToEdit.siblingStudentIds || (studentToEdit.siblingStudentId ? [studentToEdit.siblingStudentId] : []);
        const reconstructed: SiblingDetail[] = [];
        for (let i = 0; i < count; i++) {
          const sId = sIds[i];
          if (sId) {
            const matchedSt = students.find((s) => s.id === sId);
            reconstructed.push({
              id: sId,
              name: matchedSt ? `${matchedSt.firstName} ${matchedSt.lastName}` : "Existing Student",
              isExisting: true,
              studentId: sId,
              admissionNo: matchedSt?.admissionNo,
            });
          } else {
            reconstructed.push({ name: "", isExisting: false });
          }
        }
        setSiblingDetails(reconstructed);
      } else {
        setSiblingDetails([]);
      }
    } else {
      setHasSiblings(false);
      setSiblingsCount(1);
      setSiblingDetails([]);
    }
  }, [studentToEdit]);

  if (!isOpen) return null;

  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, dob: value }));
    if (value) {
      const res = validateDOB(value);
      setDobError(res.isValid ? '' : res.error || '');
    } else {
      setDobError('Date of birth is required.');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, fatherPhone: value, phone: value }));
    if (value) {
      const res = validate10DigitPhone(value);
      setPhoneError(res.isValid ? '' : res.error || '');
    } else {
      setPhoneError('Father 10-digit mobile number is required.');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        addToast('info', 'Photo Loaded', 'Profile photo preview updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }));
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.fatherName) {
      addToast('warning', 'Missing Fields', 'First name, last name, and father name are required.');
      return;
    }

    const dobValidation = validateDOB(formData.dob || '');
    if (!dobValidation.isValid) {
      setDobError(dobValidation.error || 'Invalid DOB format');
      addToast('error', 'Date Validation Error', dobValidation.error);
      return;
    }

    const phoneValidation = validate10DigitPhone(formData.fatherPhone || '');
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid 10-digit phone');
      addToast('error', 'Phone Validation Error', phoneValidation.error);
      return;
    }

    // Combine address
    const fullAddr = [
      houseNo ? `H.No ${houseNo}` : '',
      street, area, city, district, stateName, pinCode ? `PIN: ${pinCode}` : ''
    ].filter(Boolean).join(', ') || formData.address || 'Main Campus Area';

    if (hasSiblings) {
      if (!siblingsCount || siblingsCount < 1) {
        addToast('error', 'Validation Error', 'Number of siblings must be at least 1.');
        return;
      }
      for (let i = 0; i < siblingDetails.length; i++) {
        const entry = siblingDetails[i];
        if (entry.isExisting) {
          if (!entry.studentId) {
            addToast('error', 'Validation Error', `Please select an existing student for Sibling ${i + 1}.`);
            return;
          }
        } else {
          if (!entry.name || !entry.name.trim()) {
            addToast('error', 'Validation Error', `Please enter a name for Sibling ${i + 1}.`);
            return;
          }
        }
      }
    }

    const selectedStudentIds = hasSiblings
      ? (siblingDetails.map((d) => d.studentId).filter(Boolean) as string[])
      : [];

    const isTransport = (formData.studentType === 'Non-Residential' || formData.studentType === 'Day Scholar') && formData.busRoute;
    const isHostel = (formData.studentType === 'Residential' || formData.studentType === 'Hosteller') && formData.hostelBed;

    const payload = {
      ...formData,
      address: fullAddr,
      transportRequired: !!isTransport,
      hostelRequired: !!isHostel,
      hasSiblings,
      siblingsCount: hasSiblings ? siblingsCount : 0,
      siblingDetails: hasSiblings ? siblingDetails : [],
      siblingStudentId: selectedStudentIds[0] || '',
      siblingStudentIds: selectedStudentIds,
    };

    if (studentToEdit) {
      updateStudent(studentToEdit.id, payload);
      addToast('success', 'Student Updated', `Updated profile for ${formData.firstName} ${formData.lastName}`);
    } else {
      addStudent(payload as Omit<Student, 'id'>);
      addToast('success', 'Student Registered', `Registered ${formData.firstName} ${formData.lastName}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl overflow-y-auto max-h-[92vh] space-y-5 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {studentToEdit ? 'Edit Student Details' : 'Register New Student'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Profile Photo Upload / Delete */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            {formData.avatar ? (
              <img src={formData.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500/20" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 ring-2 ring-brand-500/20 shrink-0">
                <User className="w-8 h-8" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Profile Photo</p>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold flex items-center gap-1 shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Photo
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Personal Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 1. Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class *</label>
                <select
                  value={formData.className}
                  onChange={e => {
                    const selectedClass = e.target.value;
                    setFormData({ ...formData, className: selectedClass, section: '' });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  {academicClasses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {academicClasses.length === 0 && (
                    <>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Section (Optional)</label>
                <select
                  value={formData.section || ''}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="">Unassigned</option>
                  {(() => {
                    const clsObj = academicClasses.find(c => c.name === formData.className);
                    const sections = clsObj?.sections || ['A', 'B', 'C'];
                    return sections.map(sec => (
                      <option key={sec} value={sec}>Sec {sec}</option>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Branch</label>
                <select
                  value={formData.branch}
                  onChange={e => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status *</label>
                <select
                  value={formData.status === 'Active' ? 'Active' : 'Inactive'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date of Birth (DD-MM-YYYY) *</label>
                <input
                  type="text"
                  required
                  placeholder="15-08-2012"
                  value={formData.dob ? formatToDDMMYYYY(formData.dob, '-') : ''}
                  onChange={handleDOBChange}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                    dobError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {dobError && <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{dobError}</p>}
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Blood Group *</label>
                <select
                  value={formData.bloodGroup}
                  onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Caste Category *</label>
                <select
                  value={
                    CASTE_CATEGORIES.includes(formData.casteCategory as any) || formData.casteCategory === 'Other'
                      ? (formData.casteCategory === 'Other' ? 'Others' : formData.casteCategory)
                      : (formData.casteCategory ? 'Others' : 'General')
                  }
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'Others') {
                      setFormData({ ...formData, casteCategory: 'Others' });
                    } else {
                      setFormData({ ...formData, casteCategory: val });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  {CASTE_CATEGORIES.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                </select>

                {(formData.casteCategory === 'Others' || formData.casteCategory === 'Other' || (!CASTE_CATEGORIES.includes(formData.casteCategory as any) && formData.casteCategory)) && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      required
                      placeholder="Specify Caste Category (e.g. Minorities / NT / VJNT)"
                      value={formData.casteCategory === 'Others' || formData.casteCategory === 'Other' ? '' : formData.casteCategory}
                      onChange={e => setFormData({ ...formData, casteCategory: e.target.value || 'Others' })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Admission / Joining Date & Late Admission Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date of Admission *</label>
                <input
                  type="date"
                  required
                  value={formData.joiningDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none cursor-pointer"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isLateAdmissionCheckboxModal"
                    checked={!!formData.isLateAdmission}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        isLateAdmission: checked,
                        feeCalculationMethod: formData.feeCalculationMethod || 'Term-wise'
                      });
                      if (checked) {
                        setIsMidYearFeeModalOpen(true);
                      }
                    }}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                  />
                  <label htmlFor="isLateAdmissionCheckboxModal" className="font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Late Admission
                  </label>
                </div>
              </div>

              {formData.isLateAdmission && (
                <div className="flex items-end pb-0.5">
                  <div className="w-full p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between shadow-xs">
                    <div>
                      <label className="block font-extrabold text-sky-900 dark:text-sky-200 text-xs">
                        Fee Calculation Method (Late Admission) *
                      </label>
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                        Selected: {formData.feeCalculationMethod || 'Term-wise'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMidYearFeeModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Popup Modal for Mid-Year Fee Calculation */}
            {isMidYearFeeModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 text-slate-900 dark:text-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Fee Calculation Method (Late Admission) *
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsMidYearFeeModalOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg cursor-pointer"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.feeCalculationMethod === 'Monthly'
                          ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="popupStudentFeeMethod"
                        value="Monthly"
                        checked={formData.feeCalculationMethod === 'Monthly'}
                        onChange={() => setFormData({ ...formData, feeCalculationMethod: 'Monthly' })}
                        className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <span className="font-extrabold text-xs">
                        Monthly (Calculate from admission month to year-end)
                      </span>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.feeCalculationMethod === 'Term-wise' || !formData.feeCalculationMethod
                          ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="popupStudentFeeMethod"
                        value="Term-wise"
                        checked={formData.feeCalculationMethod === 'Term-wise' || !formData.feeCalculationMethod}
                        onChange={() => setFormData({ ...formData, feeCalculationMethod: 'Term-wise' })}
                        className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <span className="font-extrabold text-xs">
                        Term-wise (Calculate from applicable term/quarter)
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsMidYearFeeModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
                    >
                      Confirm & Apply Method
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Parent & Guardian Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> 2. Parent & Mobile Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Father Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fatherName}
                  onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Mother Full Name</label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Father Mobile Number (10 Digits) *</label>
                <input
                  type="text"
                  required
                  placeholder="9876543210"
                  value={formData.fatherPhone}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                    phoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {phoneError && <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{phoneError}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Address Breakdown */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> 3. Complete Residential Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">House No</label><input type="text" value={houseNo} onChange={e => setHouseNo(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
              <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Street</label><input type="text" value={street} onChange={e => setStreet(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
              <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Area / Locality</label><input type="text" value={area} onChange={e => setArea(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
              <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">City</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">District</label><input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
              <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">State</label><input type="text" value={stateName} onChange={e => setStateName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
              <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">PIN Code</label><input type="text" value={pinCode} onChange={e => setPinCode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono" /></div>
            </div>
          </div>

          {/* Section 4: Siblings */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> 4. Sibling Information
            </h4>

            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-4 animate-in fade-in">
              {/* 1. First Question */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Any siblings?
                </span>
                <div className="flex gap-5 font-bold text-xs text-slate-900 dark:text-white">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-sky-600 transition-colors">
                    <input
                      type="radio"
                      name="modalHasSiblingsRadio"
                      checked={hasSiblings === true}
                      onChange={() => handleHasSiblingsChange(true)}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-sky-600 transition-colors">
                    <input
                      type="radio"
                      name="modalHasSiblingsRadio"
                      checked={hasSiblings === false}
                      onChange={() => handleHasSiblingsChange(false)}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    No
                  </label>
                </div>
              </div>

              {/* 2 & 3. Display when Yes is selected */}
              {hasSiblings && (
                <div className="space-y-4 pt-3 border-t border-sky-100 dark:border-sky-900/40">
                  <div className="max-w-xs">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                      Number of Siblings *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={siblingsCount === 0 ? "" : siblingsCount}
                      onChange={(e) => handleSiblingsCountChange(e.target.value)}
                      onBlur={() => {
                        if (!siblingsCount || siblingsCount < 1) {
                          handleSiblingsCountChange("1");
                        }
                      }}
                      placeholder="e.g. 1"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Dynamic Sibling Cards */}
                  <div className="space-y-3 pt-1">
                    {siblingDetails.map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="font-extrabold text-xs text-sky-700 dark:text-sky-400">
                            Sibling {idx + 1}
                          </span>
                        </div>

                        {/* Is already enrolled? */}
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                            Is this sibling already enrolled in this school?
                          </span>
                          <div className="flex gap-4 font-bold text-xs text-slate-900 dark:text-white">
                            <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                              <input
                                type="radio"
                                name={`modalSiblingIsExisting_${idx}`}
                                checked={entry.isExisting === true}
                                onChange={() => handleSiblingIsExistingChange(idx, true)}
                                className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                              Yes
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                              <input
                                type="radio"
                                name={`modalSiblingIsExisting_${idx}`}
                                checked={entry.isExisting === false}
                                onChange={() => handleSiblingIsExistingChange(idx, false)}
                                className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                              No
                            </label>
                          </div>
                        </div>

                        {/* If Existing = Yes: Searchable Existing Student Dropdown */}
                        {entry.isExisting ? (
                          <div>
                            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                              Select Existing Student *
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSiblingDropdownIdx(
                                    activeSiblingDropdownIdx === idx ? null : idx
                                  );
                                  setSiblingSearchQuery("");
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs cursor-pointer flex justify-between items-center pr-10 font-bold text-left"
                              >
                                <span className="truncate">
                                  {entry.studentId
                                    ? `${entry.name} — ${entry.admissionNo || "Enrolled"}`
                                    : "Search student name or admission no..."}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </button>

                              {activeSiblingDropdownIdx === idx && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setActiveSiblingDropdownIdx(null)}
                                  />
                                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-2">
                                    <div className="relative">
                                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                      <input
                                        type="text"
                                        autoFocus
                                        placeholder="Search student name or admission no..."
                                        value={siblingSearchQuery}
                                        onChange={(e) => setSiblingSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                                      />
                                    </div>

                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                      {students
                                        .filter((s) => {
                                          if (!siblingSearchQuery.trim()) return true;
                                          const q = siblingSearchQuery.toLowerCase();
                                          return (
                                            `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
                                            (s.admissionNo && s.admissionNo.toLowerCase().includes(q))
                                          );
                                        })
                                        .map((s) => {
                                          const isSelected = entry.studentId === s.id;
                                          return (
                                            <div
                                              key={s.id}
                                              onClick={() => handleSelectExistingStudent(idx, s)}
                                              className={`px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg text-xs font-bold flex items-center gap-2.5 transition-colors ${
                                                isSelected
                                                  ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                                                  : "text-slate-800 dark:text-slate-200"
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name={`modalStudentSelectRadio_${idx}`}
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                                              />
                                              <div className="flex-1 min-w-0">
                                                <span className="truncate block font-bold">
                                                  {s.firstName} {s.lastName} — {s.admissionNo || "ADM-N/A"}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                  Class {s.className} {s.section ? `(${s.section})` : ""}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* If Existing = No: Manual Name Input */
                          <div>
                            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                              Sibling Name *
                            </label>
                            <input
                              type="text"
                              placeholder="Enter sibling name"
                              value={entry.name || ""}
                              onChange={(e) => handleSiblingNameChange(idx, e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Student Type & Facility Allocation */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5" /> 5. Student Type & Facility Allocation
            </h4>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Student Type *</label>
              <select
                value={formData.studentType}
                onChange={e => setFormData({ ...formData, studentType: e.target.value as StudentType })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
              >
                <option value="Non-Residential">Non-Residential</option>
                <option value="Residential">Residential</option>
              </select>
            </div>

            {(formData.studentType === 'Non-Residential' || formData.studentType === 'Day Scholar') && (
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Transport Type</label>
                    <select value={formData.transportType} onChange={e => setFormData({ ...formData, transportType: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none">
                      <option value="AC">AC Bus</option>
                      <option value="Non-AC">Non-AC Bus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bus Route</label>
                    <select value={formData.busRoute} onChange={e => setFormData({ ...formData, busRoute: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none">
                      {transportRoutes.map(r => <option key={r.id} value={r.routeName}>{r.routeName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Pickup Point</label>
                    <input type="text" value={formData.pickupPoint} onChange={e => setFormData({ ...formData, pickupPoint: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Drop Point</label>
                    <input type="text" value={formData.dropPoint} onChange={e => setFormData({ ...formData, dropPoint: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" />
                  </div>
                </div>
              </div>
            )}

            {(formData.studentType === 'Residential' || formData.studentType === 'Hosteller') && (
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                <h5 className="font-bold text-sky-900 dark:text-sky-200">Hostel Bed Allocation</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Block</label>
                    <select value={formData.hostelBlock} onChange={e => setFormData({ ...formData, hostelBlock: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none">
                      {hostelBlocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Available Bed</label>
                    <select value={formData.hostelBed} onChange={e => setFormData({ ...formData, hostelBed: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold outline-none">
                      <option value="">-- Select Available Bed --</option>
                      {availableBeds.map(b => <option key={b.id} value={b.id}>{b.bedNo} (Room #{b.roomId}) - Available</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg transition-colors"
            >
              {studentToEdit ? 'Save Changes' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
