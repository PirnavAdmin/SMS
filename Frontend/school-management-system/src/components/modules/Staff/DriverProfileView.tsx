// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Mail, Phone, Bus, Route, MapPin, Calendar,
  ShieldCheck, Edit2, X, Check, AlertCircle, Save, Camera,
  CheckCircle2, Clock, FileText, Award, Layers
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import {
  validateDrivingLicense,
  sanitizeDrivingLicenseInput,
  normalizeDrivingLicense,
  DRIVING_LICENCE_ERROR_MESSAGE,
  validate10DigitPhone,
  validatePhoneNumber,
  sanitizePhoneInput,
  sanitizeEmailInput,
  validateEmail,
  validateAddress,
} from '../../../utils/validation';
import { parseDateOnly, compareDates, formatToISO } from '../../../utils/dateValidation';

const normalizeToISODate = (raw?: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim().split(/[T ]/)[0];
  if (!clean) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const parsed = parseDateOnly(clean);
  if (parsed) {
    return `${String(parsed.year).padStart(4, '0')}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
  }
  return formatToISO(clean);
};

const sanitizeDateInputYear = (val: string): string => {
  if (!val) return '';
  const parts = val.split('-');
  if (parts.length === 3 && parts[0].length > 4) {
    parts[0] = parts[0].slice(0, 4);
    return parts.join('-');
  }
  return val;
};

const STANDARD_LICENSE_TYPES = [
  'Commercial (HMV)',
  'Heavy Motor Vehicle',
  'Light Motor Vehicle (LMV)',
  'Transport Vehicle',
  'Commercial (LMV)'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const DriverProfileView: React.FC = () => {
  const { user } = useAuth();
  const {
    staff = [],
    driverMasters = [],
    vehicleAssignments = [],
    vehicleMasters = [],
    routeMasters = [],
    pickupPoints = [],
    updateDriverMaster,
    updateStaff,
    schoolProfile
  } = useData();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);

  // 1. Dynamically match logged-in driver from driverMasters and staff
  const matchedDriver = useMemo(() => {
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    const userPhone = (user?.phone || '').trim().toLowerCase();
    const userEmpId = (user?.id || (user as any)?.empId || (user as any)?.employeeId || '').trim().toLowerCase();

    // Match from driverMasters
    const fromMaster = driverMasters.find(d =>
      (userEmpId && (d.employeeId?.toLowerCase() === userEmpId || (d as any).empId?.toLowerCase() === userEmpId || String(d.id).toLowerCase() === userEmpId)) ||
      (userEmail && d.email?.toLowerCase() === userEmail) ||
      (userPhone && d.mobileNumber?.replace(/\D/g, '') === userPhone.replace(/\D/g, '')) ||
      (userName && d.driverName?.toLowerCase() === userName) ||
      (userName && (d.driverName?.toLowerCase().includes(userName) || userName.includes(d.driverName?.toLowerCase())))
    );

    // Match from staff (must accurately resolve to driver/transport staff and match identity)
    const fromStaff = (() => {
      // 1. Look for matching staff in Transport department or with Driver designation by user name
      if (userName && userName !== 'user' && userName !== 'administrator') {
        const transportDriverByName = staff.find(s => {
          const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
          const sName = (s.name || '').trim().toLowerCase();
          const isTransportOrDriver = s.department?.toLowerCase() === 'transport' || s.designation?.toLowerCase().includes('driver') || (s as any).role?.toLowerCase().includes('driver');
          return isTransportOrDriver && (sFullName === userName || sName === userName || (userName.length >= 3 && (sFullName.includes(userName) || userName.includes(sFullName))));
        });
        if (transportDriverByName) return transportDriverByName;
      }

      // 2. Look for matching staff in Transport / Driver by matching fromMaster
      if (fromMaster) {
        const masterName = (fromMaster.driverName || '').trim().toLowerCase();
        const masterEmpId = (fromMaster.employeeId || '').trim().toLowerCase();
        const masterEmail = (fromMaster.email || '').trim().toLowerCase();
        const masterPhone = (fromMaster.mobileNumber || '').replace(/\D/g, '');

        const byMaster = staff.find(s => {
          const sEmpId = (s.empId || (s as any).employeeId || '').toLowerCase();
          const sEmail = (s.email || '').toLowerCase();
          const sPhone = (s.phone || (s as any).mobileNumber || '').replace(/\D/g, '');
          const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
          const sName = (s.name || '').trim().toLowerCase();
          const isTransportOrDriver = s.department?.toLowerCase() === 'transport' || s.designation?.toLowerCase().includes('driver') || (s as any).role?.toLowerCase().includes('driver');

          const nameMatches = masterName && (sFullName === masterName || sName === masterName || sFullName.includes(masterName) || masterName.includes(sFullName));
          const empMatches = masterEmpId && sEmpId === masterEmpId;
          const emailMatches = masterEmail && sEmail === masterEmail;
          const phoneMatches = masterPhone && sPhone && sPhone === masterPhone;

          return isTransportOrDriver && (nameMatches || (empMatches && nameMatches) || emailMatches || phoneMatches);
        });
        if (byMaster) return byMaster;
      }

      // 3. Match Transport staff by user email, phone, or empId
      const transportStaffByUser = staff.find(s => {
        const sEmpId = (s.empId || (s as any).employeeId || '').toLowerCase();
        const sEmail = (s.email || '').toLowerCase();
        const sPhone = (s.phone || (s as any).mobileNumber || '').replace(/\D/g, '');
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
        const sName = (s.name || '').trim().toLowerCase();
        const isTransportOrDriver = s.department?.toLowerCase() === 'transport' || s.designation?.toLowerCase().includes('driver') || (s as any).role?.toLowerCase().includes('driver');

        if (!isTransportOrDriver) return false;

        return (
          (userEmail && sEmail === userEmail) ||
          (userPhone && sPhone && sPhone === userPhone.replace(/\D/g, '')) ||
          (userName && (sFullName === userName || sName === userName)) ||
          (userEmpId && sEmpId === userEmpId && (userName ? (sFullName === userName || sName === userName) : true))
        );
      });
      if (transportStaffByUser) return transportStaffByUser;

      // 4. Name fallback (never match non-transport staff by empId alone to avoid cross-role collision with wardens/teachers)
      if (userName && userName !== 'user' && userName !== 'administrator') {
        const byExactName = staff.find(s => {
          const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
          const sName = (s.name || '').trim().toLowerCase();
          const isNotUnrelatedRole = s.department?.toLowerCase() !== 'hostel' && !s.designation?.toLowerCase().includes('warden');
          return isNotUnrelatedRole && (sFullName === userName || sName === userName);
        });
        if (byExactName) return byExactName;
      }

      return null;
    })();

    const resolvedBloodGroup = (fromMaster as any)?.bloodGroup || fromStaff?.bloodGroup || (fromStaff as any)?.blood_group || (user as any)?.bloodGroup || '';
    const resolvedEmergency = (fromMaster as any)?.emergencyContact || (fromStaff as any)?.emergencyContact || (fromStaff as any)?.emergencyContactNumber || (fromStaff as any)?.emergencyPhone || (fromStaff as any)?.fatherPhone || (fromStaff as any)?.guardianPhone || '';
    const resolvedJoiningDate = (fromMaster as any)?.dateOfJoining || (fromMaster as any)?.joiningDate || fromStaff?.joiningDate || (fromStaff as any)?.dateOfJoining || (user as any)?.joiningDate || '';
    const resolvedAddress = fromMaster?.address || fromStaff?.address || (fromStaff as any)?.presentAddress || (fromStaff as any)?.permanentAddress || (user as any)?.address || '';
    const resolvedMobile = fromMaster?.mobileNumber || fromStaff?.phone || (fromStaff as any)?.mobileNumber || user?.phone || '';
    const resolvedEmail = fromMaster?.email || fromStaff?.email || user?.email || '';
    const resolvedEmpId = fromMaster?.employeeId || fromStaff?.empId || fromStaff?.employeeId || (user as any)?.empId || user?.id || '';
    const resolvedName = (user?.name && user.name.toLowerCase() !== 'user' && user.name.toLowerCase() !== 'administrator')
      ? user.name
      : (fromMaster?.driverName || (fromStaff ? `${fromStaff.firstName || ''} ${fromStaff.lastName || ''}`.trim() : (user?.name || '')));

    const resolvedLicense = fromMaster?.licenseNumber || (fromStaff as any)?.licenseNumber || '';
    const resolvedLicenseExpiry = fromMaster?.licenseExpiryDate || (fromStaff as any)?.licenseExpiryDate || (fromMaster as any)?.licenceExpiry || '';
    const resolvedLicenseType = (fromMaster as any)?.licenseType || (fromStaff as any)?.licenseType || '';
    const resolvedExperience = (fromMaster?.experienceYears !== undefined && fromMaster.experienceYears !== null)
      ? fromMaster.experienceYears
      : ((fromStaff as any)?.experienceYears !== undefined && (fromStaff as any)?.experienceYears !== null ? (fromStaff as any).experienceYears : '');
    // Dynamically resolve Department for Driver profile:
    // Prioritizes driver master or transport staff, dynamically defaulting to "Transport"
    let resolvedDept =
      (fromMaster as any)?.department ||
      (fromStaff?.department && fromStaff.department.toLowerCase() !== 'hostel' && fromStaff.department.toLowerCase() !== 'academic' ? fromStaff.department : '') ||
      (user as any)?.department ||
      'Transport';
    if (!resolvedDept || resolvedDept.toLowerCase() === 'hostel' || resolvedDept.toLowerCase() === 'academic' || resolvedDept.toLowerCase() === 'general') {
      resolvedDept = 'Transport';
    }

    // Dynamically resolve Designation for Driver profile:
    // Prioritizes driver master or transport staff, dynamically defaulting to "Driver"
    let resolvedDesig =
      (fromMaster as any)?.designation ||
      (fromStaff?.designation && !fromStaff.designation.toLowerCase().includes('warden') && !fromStaff.designation.toLowerCase().includes('teacher') ? fromStaff.designation : '') ||
      (user as any)?.designation ||
      'Driver';
    if (!resolvedDesig || resolvedDesig.toLowerCase().includes('warden') || resolvedDesig.toLowerCase().includes('teacher') || resolvedDesig.toLowerCase().includes('accountant') || resolvedDesig.toLowerCase() === 'staff') {
      resolvedDesig = 'Driver';
    }

    const resolvedStatus = fromMaster?.status || fromStaff?.status || (user as any)?.status || 'Active';

    return {
      id: fromMaster?.id || fromStaff?.id || user?.id || '',
      staffId: fromStaff?.id || '',
      driverName: resolvedName,
      employeeId: resolvedEmpId,
      mobileNumber: resolvedMobile,
      email: resolvedEmail,
      address: resolvedAddress,
      bloodGroup: resolvedBloodGroup,
      emergencyContact: resolvedEmergency,
      dateOfJoining: resolvedJoiningDate,
      licenseNumber: resolvedLicense,
      licenseExpiryDate: resolvedLicenseExpiry,
      licenseType: resolvedLicenseType,
      experienceYears: resolvedExperience,
      department: resolvedDept,
      designation: resolvedDesig,
      status: resolvedStatus,
      avatar: (fromMaster as any)?.avatar || fromStaff?.avatar || user?.avatar || ''
    };
  }, [user, driverMasters, staff]);

  // 2. Resolve Active Vehicle Assignment
  const currentAssignment = useMemo(() => {
    const driverId = String(matchedDriver.id).trim();
    const driverName = (matchedDriver.driverName || '').trim().toLowerCase();
    const driverEmpId = (matchedDriver.employeeId || '').trim().toLowerCase();

    const matched = vehicleAssignments.find(va => {
      const vaDriverId = String(va.driverId || '').trim();
      const vaDriverName = (va.driverName || '').trim().toLowerCase();
      const vaDriverEmpId = (va.driverEmployeeId || '').trim().toLowerCase();

      return (
        (driverId && vaDriverId === driverId) ||
        (driverName && vaDriverName === driverName) ||
        (driverEmpId && vaDriverEmpId === driverEmpId)
      );
    });

    return matched || null;
  }, [matchedDriver, vehicleAssignments]);

  // 3. Resolve Vehicle & Route
  const assignedVehicle = useMemo(() => {
    if (!currentAssignment) return null;
    return vehicleMasters.find(v =>
      (currentAssignment.vehicleId && String(v.id).trim() === String(currentAssignment.vehicleId).trim()) ||
      (currentAssignment.vehicleNumber && v.vehicleNumber && v.vehicleNumber.trim().toUpperCase() === currentAssignment.vehicleNumber.trim().toUpperCase())
    ) || null;
  }, [currentAssignment, vehicleMasters]);

  const assignedRoute = useMemo(() => {
    if (!currentAssignment) return null;
    return routeMasters.find(r =>
      (currentAssignment.routeId && String(r.id).trim() === String(currentAssignment.routeId).trim()) ||
      (currentAssignment.routeName && r.routeName && r.routeName.trim().toLowerCase() === currentAssignment.routeName.trim().toLowerCase()) ||
      (currentAssignment.routeName && r.routeCode && r.routeCode.trim().toLowerCase() === currentAssignment.routeName.trim().toLowerCase())
    ) || null;
  }, [currentAssignment, routeMasters]);

  const routeStopsCount = useMemo(() => {
    const targetRouteId = assignedRoute?.id ? String(assignedRoute.id).trim() : '';
    const targetRouteName = (assignedRoute?.routeName || '').trim().toLowerCase();
    return pickupPoints.filter(p =>
      (p.routeId && targetRouteId && String(p.routeId).trim() === targetRouteId) ||
      (p.routeName && targetRouteName && p.routeName.trim().toLowerCase() === targetRouteName)
    ).length;
  }, [pickupPoints, assignedRoute]);

  const todayISO = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const maxExpiryISO = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear() + 20}-12-31`;
  }, []);

  // Helper to extract baseline form data directly from saved matchedDriver
  const getDriverFormData = (driver: typeof matchedDriver) => ({
    mobile: driver.mobileNumber || '',
    email: driver.email || '',
    address: driver.address || '',
    emergencyContact: driver.emergencyContact || '',
    bloodGroup: driver.bloodGroup || '',
    licenseNumber: driver.licenseNumber || '',
    licenseType: driver.licenseType || '',
    licenseExpiry: normalizeToISODate(driver.licenseExpiryDate || ''),
    experienceYears: (driver.experienceYears !== undefined && driver.experienceYears !== null) ? driver.experienceYears : '',
  });

  // Edit Form State
  const [formData, setFormData] = useState(() => getDriverFormData(matchedDriver));
    const [contactErrors, setContactErrors] = useState<{
    mobile?: string;
    email?: string;
    emergencyContact?: string;
    address?: string;
  }>({});
  const [licenseError, setLicenseError] = useState<string>('');
  const [licenseExpiryError, setLicenseExpiryError] = useState<string>('');

  // Keep form data synchronized with saved driver data whenever not editing
  useEffect(() => {
    if (!isEditing) {
      setFormData(getDriverFormData(matchedDriver));
    }
  }, [matchedDriver, isEditing]);

  const handleStartEdit = () => {
    const initialData = getDriverFormData(matchedDriver);
    setFormData(initialData);

    const initialErrors: {
      mobile?: string;
      email?: string;
      emergencyContact?: string;
      address?: string;
    } = {};

    if (initialData.address?.trim()) {
      const addrCheck = validateAddress(initialData.address.trim(), false);
      if (!addrCheck.isValid) {
        initialErrors.address = addrCheck.error;
      }
    }
    if (initialData.mobile?.trim()) {
      const cleanMobile = initialData.mobile.replace(/\D/g, '');
      const mobileCheck = validate10DigitPhone(cleanMobile);
      if (!mobileCheck.isValid) {
        initialErrors.mobile = mobileCheck.error;
      }
    }
    if (initialData.email?.trim()) {
      const emailCheck = validateEmail(initialData.email.trim(), true);
      if (!emailCheck.isValid) {
        initialErrors.email = emailCheck.error;
      }
    }

    setContactErrors(initialErrors);
    setLicenseError('');
    setLicenseExpiryError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData(getDriverFormData(matchedDriver));
    setContactErrors({});
    setLicenseError('');
    setLicenseExpiryError('');
    setIsEditing(false);
  };

  const validateLicenseExpiryDate = (dateStr: string): { isValid: boolean; error?: string } => {
    if (!dateStr || !dateStr.trim()) {
      return { isValid: false, error: 'License expiry date is required.' };
    }
    const rawParts = dateStr.trim().split('-');
    if (rawParts.length !== 3 || rawParts[0].length !== 4) {
      return { isValid: false, error: 'Please enter a valid 4-digit year.' };
    }
    const yearNum = parseInt(rawParts[0], 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 20) {
      return {
        isValid: false,
        error: `Please enter a valid year between ${currentYear} and ${currentYear + 20}.`
      };
    }
    const parsed = parseDateOnly(dateStr);
    if (!parsed) {
      return { isValid: false, error: 'Please enter a valid license expiry date.' };
    }
    const todayParts = parseDateOnly(todayISO);
    if (todayParts && compareDates(parsed, todayParts) < 0) {
      return {
        isValid: false,
        error: 'License expiry date cannot be in the past. Please enter a valid future expiry date.'
      };
    }
    return { isValid: true };
  };

  const persistProfileData = async (overrides: Partial<typeof formData> = {}) => {
    const updatedData = { ...formData, ...overrides };
    const parsedExp = updatedData.experienceYears === '' ? 0 : Number(updatedData.experienceYears) || 0;
    const finalLicense = updatedData.licenseNumber ? updatedData.licenseNumber.trim().toUpperCase() : '';
    const finalExpiry = updatedData.licenseExpiry ? normalizeToISODate(updatedData.licenseExpiry) : '';
    const finalMobile = updatedData.mobile ? updatedData.mobile.trim() : '';
    const finalEmail = updatedData.email ? updatedData.email.trim() : '';
    const finalAddress = updatedData.address ? updatedData.address.trim() : '';
    const finalEmergency = updatedData.emergencyContact ? updatedData.emergencyContact.trim() : '';

    if (matchedDriver?.id && updateDriverMaster) {
      await updateDriverMaster(String(matchedDriver.id), {
        employeeId: matchedDriver.employeeId || undefined,
        driverName: matchedDriver.driverName || undefined,
        licenseNumber: finalLicense,
        licenseExpiryDate: finalExpiry,
        licenseType: updatedData.licenseType,
        experienceYears: parsedExp,
        mobileNumber: finalMobile,
        email: finalEmail,
        address: finalAddress,
        emergencyContact: finalEmergency,
        bloodGroup: updatedData.bloodGroup,
      });
    }

    // Also sync with staff store if driver exists as a staff record
    if (matchedDriver?.staffId && updateStaff) {
      updateStaff(matchedDriver.staffId, {
        phone: finalMobile,
        email: finalEmail,
        address: finalAddress,
        bloodGroup: updatedData.bloodGroup,
        emergencyContact: finalEmergency
      } as any);
    }
  };

  const handleSaveContactDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { mobile?: string; email?: string; emergencyContact?: string; address?: string } = {};

    const cleanMobile = (formData.mobile || '').replace(/\D/g, '');
    const mobileCheck = validate10DigitPhone(cleanMobile);
    if (!mobileCheck.isValid) {
      errors.mobile = mobileCheck.error;
    }

    const cleanEmail = (formData.email || '').trim();
    const emailCheck = validateEmail(cleanEmail, true);
    if (!emailCheck.isValid) {
      errors.email = emailCheck.error;
    }

    if (formData.emergencyContact?.trim()) {
      const cleanEm = formData.emergencyContact.replace(/\D/g, '');
      const emCheck = validatePhoneNumber(cleanEm, false);
      if (!emCheck.isValid) {
        errors.emergencyContact = emCheck.error;
      }
    }

    const cleanAddress = (formData.address || '').trim();
    if (cleanAddress) {
      const addressCheck = validateAddress(cleanAddress, false);
      if (!addressCheck.isValid) {
        errors.address = addressCheck.error;
      }
    }

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      const firstError = errors.address || errors.email || errors.mobile || errors.emergencyContact;
      addToast('error', 'Cannot Save Profile', firstError || 'Please correct the invalid fields before saving.');
      return;
    }

    setContactErrors({});

    try {
      await persistProfileData({
        mobile: cleanMobile,
        email: cleanEmail,
        address: (formData.address || '').trim(),
        emergencyContact: (formData.emergencyContact || '').trim(),
      });
      addToast('success', 'Profile Updated', 'Personal and contact details saved successfully.');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      addToast('error', 'Update Failed', 'Could not save profile changes.');
    }
  };

  const handleSaveLicenseDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedLic = normalizeDrivingLicense(formData.licenseNumber);
    const licCheck = validateDrivingLicense(normalizedLic, true);
    if (!licCheck.isValid) {
      setLicenseError(licCheck.error || DRIVING_LICENCE_ERROR_MESSAGE);
      addToast('error', 'Invalid License Number', licCheck.error || DRIVING_LICENCE_ERROR_MESSAGE);
      return;
    }

    const expCheck = validateLicenseExpiryDate(formData.licenseExpiry);
    if (!expCheck.isValid) {
      setLicenseExpiryError(expCheck.error || 'Enter a valid license expiry date.');
      addToast('error', 'Invalid Expiry Date', expCheck.error || 'Please enter a valid license expiry date.');
      return;
    }

    setLicenseError('');
    setLicenseExpiryError('');

    try {
      const cleanLicense = normalizedLic;
      const cleanExpiry = normalizeToISODate(formData.licenseExpiry);
      setFormData(prev => ({
        ...prev,
        licenseNumber: cleanLicense,
        licenseExpiry: cleanExpiry,
      }));
      await persistProfileData({
        licenseNumber: cleanLicense,
        licenseExpiry: cleanExpiry,
      });
      addToast('success', 'License Credentials Updated', 'Driving license number and expiry date saved successfully.');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      addToast('error', 'Update Failed', 'Could not save license changes.');
    }
  };

  const inputClass = "w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none";

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl border border-sky-200/90 dark:border-sky-850 bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {matchedDriver.avatar ? (
                <img
                  key={matchedDriver.avatar}
                  src={resolveMediaUrl(matchedDriver.avatar)}
                  alt={matchedDriver.driverName || 'Driver'}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-md ring-2 ring-sky-500/20"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = 'none';
                    const fb = target.nextElementSibling as HTMLElement | null;
                    if (fb) fb.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-xl items-center justify-center shadow-md ${
                  matchedDriver.avatar ? 'hidden' : 'flex'
                }`}
              >
                {matchedDriver.driverName?.charAt(0) || 'D'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Active" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {matchedDriver.driverName || '—'}
                </h2>
                {matchedDriver.status ? (
                  <Badge variant={matchedDriver.status === 'Active' || matchedDriver.status === true ? 'success' : 'neutral'} size="sm">
                    {typeof matchedDriver.status === 'boolean' ? (matchedDriver.status ? 'Active' : 'Inactive') : matchedDriver.status}
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                ID: {matchedDriver.employeeId || '—'} {matchedDriver.department ? `• Department: ${matchedDriver.department}` : ''}
              </p>
              {matchedDriver.designation ? (
                <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                  Designation: {matchedDriver.designation}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={isEditing ? handleCancelEdit : handleStartEdit}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto border active:scale-95 ${
              isEditing
                ? "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/80"
                : "bg-sky-600 hover:bg-sky-500 text-white border-transparent"
            }`}
          >
            {isEditing ? <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> : <Edit2 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Personal & Contact Information */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-sky-600" /> Personal & Contact Details
          </h3>

          {!isEditing ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mobile Number</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{matchedDriver.mobileNumber || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{matchedDriver.email || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Residential Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{matchedDriver.address || '—'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
                  <span className="font-black text-rose-600">{matchedDriver.bloodGroup || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{matchedDriver.emergencyContact || '—'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Joining</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {matchedDriver.dateOfJoining || '—'}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveContactDetails} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={e => {
                    const clean = sanitizePhoneInput(e.target.value);
                    setFormData(prev => ({ ...prev, mobile: clean }));
                    if (contactErrors.mobile) {
                      const res = validate10DigitPhone(clean);
                      if (res.isValid) {
                        setContactErrors(prev => ({ ...prev, mobile: undefined }));
                      }
                    }
                  }}
                  onBlur={e => {
                    const res = validate10DigitPhone(e.target.value);
                    if (!res.isValid) {
                      setContactErrors(prev => ({ ...prev, mobile: res.error }));
                    } else {
                      setContactErrors(prev => ({ ...prev, mobile: undefined }));
                    }
                  }}
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  className={`${inputClass} ${contactErrors.mobile ? 'border-rose-500 text-rose-700 dark:text-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  required
                />
                {contactErrors.mobile && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{contactErrors.mobile}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => {
                    const clean = sanitizeEmailInput(e.target.value);
                    setFormData(prev => ({ ...prev, email: clean }));
                    if (contactErrors.email) {
                      const res = validateEmail(clean, true);
                      if (res.isValid) {
                        setContactErrors(prev => ({ ...prev, email: undefined }));
                      }
                    }
                  }}
                  onBlur={e => {
                    const clean = e.target.value.trim();
                    const res = validateEmail(clean, true);
                    if (!res.isValid) {
                      setContactErrors(prev => ({ ...prev, email: res.error }));
                    } else {
                      setContactErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  placeholder="e.g. driver@gmail.com"
                  className={`${inputClass} ${contactErrors.email ? 'border-rose-500 text-rose-700 dark:text-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  required
                />
                {contactErrors.email && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{contactErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, address: val }));
                    if (val.trim()) {
                      const res = validateAddress(val.trim(), false);
                      setContactErrors(prev => ({ ...prev, address: res.isValid ? undefined : res.error }));
                    } else {
                      setContactErrors(prev => ({ ...prev, address: undefined }));
                    }
                  }}
                  onBlur={e => {
                    const val = e.target.value.trim();
                    if (val) {
                      const res = validateAddress(val, false);
                      setContactErrors(prev => ({ ...prev, address: res.isValid ? undefined : res.error }));
                    } else {
                      setContactErrors(prev => ({ ...prev, address: undefined }));
                    }
                  }}
                  className={`${inputClass} ${contactErrors.address ? 'border-rose-500 text-rose-700 dark:text-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  placeholder="e.g. Flat 302, Green Valley Apartments, Madhapur"
                />
                {contactErrors.address && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{contactErrors.address}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                    className={inputClass + ' cursor-pointer'}
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={e => {
                      const clean = sanitizePhoneInput(e.target.value);
                      setFormData(prev => ({ ...prev, emergencyContact: clean }));
                      if (contactErrors.emergencyContact) {
                        const res = validatePhoneNumber(clean, false);
                        if (res.isValid) {
                          setContactErrors(prev => ({ ...prev, emergencyContact: undefined }));
                        }
                      }
                    }}
                    onBlur={e => {
                      if (e.target.value.trim()) {
                        const res = validatePhoneNumber(e.target.value.trim(), false);
                        if (!res.isValid) {
                          setContactErrors(prev => ({ ...prev, emergencyContact: res.error }));
                        } else {
                          setContactErrors(prev => ({ ...prev, emergencyContact: undefined }));
                        }
                      } else {
                        setContactErrors(prev => ({ ...prev, emergencyContact: undefined }));
                      }
                    }}
                    maxLength={10}
                    className={`${inputClass} ${contactErrors.emergencyContact ? 'border-rose-500 text-rose-700 dark:text-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                    placeholder="e.g. 9876543210"
                  />
                  {contactErrors.emergencyContact && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{contactErrors.emergencyContact}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={Boolean(contactErrors.mobile || contactErrors.email || contactErrors.emergencyContact || contactErrors.address)}
                  className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-600 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Middle Column: Driving License & Commercial Credentials */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> License & Safety Credentials
          </h3>

          {!isEditing ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Driving License Number</span>
                <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                  {matchedDriver.licenseNumber || '—'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {matchedDriver.licenseType ? (
                    <Badge variant="success" size="sm">Verified {matchedDriver.licenseType}</Badge>
                  ) : matchedDriver.licenseNumber ? (
                    <Badge variant="success" size="sm">Verified License</Badge>
                  ) : null}
                  {matchedDriver.licenseExpiryDate ? (
                    <span className="text-[10px] text-slate-400">Exp: {normalizeToISODate(matchedDriver.licenseExpiryDate)}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Exp: —</span>
                  )}
                </div>
              </div>

              {(matchedDriver.experienceYears !== undefined && matchedDriver.experienceYears !== null && matchedDriver.experienceYears !== '') ? (
                <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
                  <span className="font-black text-sm text-sky-600">{matchedDriver.experienceYears} Years</span>
                </div>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSaveLicenseDetails} noValidate className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Driving License Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  data-skip-global-validation="true"
                  value={formData.licenseNumber}
                  onChange={e => {
                    const sanitized = sanitizeDrivingLicenseInput(e.target.value);
                    setFormData(prev => ({ ...prev, licenseNumber: sanitized }));
                    if (licenseError) {
                      const res = validateDrivingLicense(sanitized, true);
                      if (res.isValid) {
                        setLicenseError('');
                      }
                    }
                  }}
                  onBlur={() => {
                    const normalized = normalizeDrivingLicense(formData.licenseNumber);
                    setFormData(prev => ({ ...prev, licenseNumber: normalized }));
                    const res = validateDrivingLicense(normalized, true);
                    setLicenseError(res.isValid ? '' : (res.error || DRIVING_LICENCE_ERROR_MESSAGE));
                  }}
                  className={`${inputClass} font-mono ${licenseError ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
                  placeholder="e.g. DL-2026-0073 or MH-12-20200012345"
                  maxLength={22}
                  required
                />
                {licenseError ? (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 leading-tight">
                    {licenseError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Format: e.g. MH-12-20200012345, AP13700322492018, or AP12/2007/0123456
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">License Type</label>
                  <select
                    value={formData.licenseType}
                    onChange={e => setFormData(prev => ({ ...prev, licenseType: e.target.value }))}
                    className={inputClass + ' cursor-pointer'}
                  >
                    <option value="">Select License Type</option>
                    {STANDARD_LICENSE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    {formData.licenseType && !STANDARD_LICENSE_TYPES.includes(formData.licenseType) && (
                      <option value={formData.licenseType}>{formData.licenseType}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    License Expiry <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    data-skip-global-validation="true"
                    min={todayISO}
                    max={maxExpiryISO}
                    value={formData.licenseExpiry}
                    onInput={e => {
                      const inputEl = e.currentTarget;
                      const sanitized = sanitizeDateInputYear(inputEl.value);
                      if (sanitized !== inputEl.value) {
                        inputEl.value = sanitized;
                      }
                    }}
                    onChange={e => {
                      const sanitized = sanitizeDateInputYear(e.target.value);
                      setFormData(prev => ({ ...prev, licenseExpiry: sanitized }));
                      const res = validateLicenseExpiryDate(sanitized);
                      setLicenseExpiryError(res.isValid ? '' : (res.error || ''));
                    }}
                    onBlur={() => {
                      const res = validateLicenseExpiryDate(formData.licenseExpiry);
                      setLicenseExpiryError(res.isValid ? '' : (res.error || ''));
                    }}
                    className={`${inputClass} ${licenseExpiryError ? '!border-rose-500 focus:!ring-rose-500/20' : ''}`}
                    required
                  />
                  {licenseExpiryError && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 leading-tight">
                      {licenseExpiryError}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.experienceYears === '' ? '' : formData.experienceYears}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, experienceYears: val === '' ? '' : val }));
                  }}
                  className={inputClass}
                  placeholder="e.g. 5"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save License Changes</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Assigned Fleet Bus & Route */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Bus className="w-4 h-4 text-sky-600" /> Assigned Vehicle & Transit Route
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">Current Fleet Bus</span>
              <div className="font-black text-base text-slate-900 dark:text-white">
                {assignedVehicle?.vehicleNumber || currentAssignment?.vehicleNumber || 'Unassigned'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Route</span>
              <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-sky-600" />
                <span>{assignedRoute?.routeName || currentAssignment?.routeName || 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Stops: <span className="font-bold text-slate-700 dark:text-slate-300">{routeStopsCount}</span></span>
                <span>Distance: <span className="font-bold text-slate-700 dark:text-slate-300">{assignedRoute?.totalDistanceKm ? `${assignedRoute.totalDistanceKm} km` : '—'}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
