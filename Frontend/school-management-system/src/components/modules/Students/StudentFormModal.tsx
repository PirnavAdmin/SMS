import React, { useState, useEffect } from 'react';
import { X, UserCheck, User, Shield, Bus, Camera, Trash2, Home } from 'lucide-react';
import { Student, StudentType } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { validateDOB, formatToDDMMYYYY } from '../../../utils/dateValidation';
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
  const { addStudent, updateStudent, students, transportRoutes, hostelBlocks, hostelRooms, hostelBeds } = useData();
  const { addToast } = useToast();

  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dob: '15/08/2012',
    bloodGroup: 'O+',
    religion: 'General',
    casteCategory: 'General',
    className: 'Class 10',
    section: 'A',
    category: 'General',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    joiningDate: new Date().toISOString().split('T')[0],
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

  const availableBeds = hostelBeds.filter(b => b.status === 'Available');

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        ...studentToEdit,
        dob: formatToDDMMYYYY(studentToEdit.dob)
      });
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

    const payload = {
      ...formData,
      address: fullAddr
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Comprehensive profile representation matching admission form</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Profile Photo Upload / Delete */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <img src={formData.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500/20" />
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

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class *</label>
                <select
                  value={formData.className}
                  onChange={e => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Section *</label>
                <select
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="A">Sec A</option>
                  <option value="B">Sec B</option>
                  <option value="C">Sec C</option>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date of Birth (DD/MM/YYYY) *</label>
                <input
                  type="text"
                  required
                  placeholder="15/08/2012"
                  value={formData.dob}
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
                  value={formData.casteCategory}
                  onChange={e => setFormData({ ...formData, casteCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  {CASTE_CATEGORIES.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                </select>
              </div>
            </div>
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">4. Sibling Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Number of Siblings</label>
                <input
                  type="number"
                  min={0}
                  value={formData.siblingsCount}
                  onChange={e => setFormData({ ...formData, siblingsCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Existing Student Sibling Lookup (Optional)</label>
                <select
                  value={formData.remarks || ''}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="">None / Not Enrolled</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.className})</option>)}
                </select>
              </div>
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
                <option value="Day Scholar">Day Scholar</option>
                <option value="Hosteller">Hosteller</option>
              </select>
            </div>

            {formData.studentType === 'Day Scholar' && (
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

            {formData.studentType === 'Hosteller' && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3 animate-in fade-in">
                <h5 className="font-bold text-indigo-900 dark:text-indigo-200">Hostel Bed Allocation</h5>
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
