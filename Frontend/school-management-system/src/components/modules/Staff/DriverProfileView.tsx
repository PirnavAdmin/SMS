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

export const DriverProfileView: React.FC = () => {
  const { user } = useAuth();
  const {
    staff = [],
    driverMasters = [],
    vehicleAssignments = [],
    vehicleMasters = [],
    routeMasters = [],
    pickupPoints = [],
    updateDriverMaster
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

    // Match from staff
    const fromStaff = staff.find(s => {
      const sEmpId = (s.empId || (s as any).employeeId || '').toLowerCase();
      const sId = String(s.id).toLowerCase();
      const sEmail = (s.email || '').toLowerCase();
      const sPhone = (s.phone || (s as any).mobileNumber || '').replace(/\D/g, '');
      const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const sName = (s.name || '').trim().toLowerCase();

      const matchesUser = (
        (userEmpId && (sEmpId === userEmpId || sId === userEmpId)) ||
        (userEmail && sEmail === userEmail) ||
        (userPhone && sPhone && sPhone === userPhone.replace(/\D/g, '')) ||
        (userName && (sFullName === userName || sName === userName || sFullName.includes(userName) || userName.includes(sFullName)))
      );

      const matchesMaster = fromMaster ? (
        (fromMaster.employeeId && (sEmpId === fromMaster.employeeId.toLowerCase() || sId === fromMaster.employeeId.toLowerCase())) ||
        (fromMaster.email && sEmail === fromMaster.email.toLowerCase()) ||
        (fromMaster.mobileNumber && sPhone && sPhone === fromMaster.mobileNumber.replace(/\D/g, '')) ||
        (fromMaster.driverName && (sFullName === fromMaster.driverName.toLowerCase() || sName === fromMaster.driverName.toLowerCase() || sFullName.includes(fromMaster.driverName.toLowerCase())))
      ) : false;

      return matchesUser || matchesMaster;
    });

    const resolvedBloodGroup = (fromMaster as any)?.bloodGroup || fromStaff?.bloodGroup || (fromStaff as any)?.blood_group || (user as any)?.bloodGroup || '';
    const resolvedEmergency = (fromMaster as any)?.emergencyContact || (fromStaff as any)?.emergencyContact || (fromStaff as any)?.emergencyContactNumber || (fromStaff as any)?.emergencyPhone || (fromStaff as any)?.fatherPhone || (fromStaff as any)?.guardianPhone || '';
    const resolvedJoiningDate = (fromMaster as any)?.dateOfJoining || (fromMaster as any)?.joiningDate || fromStaff?.joiningDate || (fromStaff as any)?.dateOfJoining || (user as any)?.joiningDate || '';
    const resolvedAddress = fromMaster?.address || fromStaff?.address || (fromStaff as any)?.presentAddress || (fromStaff as any)?.permanentAddress || (user as any)?.address || '';
    const resolvedMobile = fromMaster?.mobileNumber || fromStaff?.phone || (fromStaff as any)?.mobileNumber || user?.phone || '';
    const resolvedEmail = fromMaster?.email || fromStaff?.email || user?.email || '';
    const resolvedEmpId = fromMaster?.employeeId || fromStaff?.empId || fromStaff?.employeeId || (user as any)?.empId || user?.id || '';
    const resolvedName = (user?.name && user.name.toLowerCase() !== 'user' && user.name.toLowerCase() !== 'administrator')
      ? user.name
      : (fromMaster?.driverName || (fromStaff ? `${fromStaff.firstName || ''} ${fromStaff.lastName || ''}`.trim() : (user?.name || 'Driver')));

    const resolvedLicense = fromMaster?.licenseNumber || (fromStaff as any)?.licenseNumber || (resolvedEmpId ? `DL-${resolvedEmpId}` : '');
    const resolvedLicenseExpiry = fromMaster?.licenseExpiryDate || (fromStaff as any)?.licenseExpiryDate || '';
    const resolvedLicenseType = (fromMaster as any)?.licenseType || (fromStaff as any)?.licenseType || 'Commercial (HMV)';
    const resolvedExperience = fromMaster?.experienceYears !== undefined ? fromMaster.experienceYears : ((fromStaff as any)?.experienceYears !== undefined ? (fromStaff as any).experienceYears : 5);
    const resolvedDept = (fromMaster as any)?.department || fromStaff?.department || 'Transport';
    const resolvedDesig = (fromMaster as any)?.designation || fromStaff?.designation || 'Driver';

    return {
      id: fromMaster?.id || fromStaff?.id || user?.id || '1',
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
      status: fromMaster?.status || fromStaff?.status || 'Active'
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

    if (matched) return matched;
    return vehicleAssignments.find(va => va.status === 'Active') || vehicleAssignments[0] || null;
  }, [matchedDriver, vehicleAssignments]);

  // 3. Resolve Vehicle & Route
  const assignedVehicle = useMemo(() => {
    if (!currentAssignment) return vehicleMasters[0] || null;
    return vehicleMasters.find(v =>
      (currentAssignment.vehicleId && String(v.id).trim() === String(currentAssignment.vehicleId).trim()) ||
      (currentAssignment.vehicleNumber && v.vehicleNumber && v.vehicleNumber.trim().toUpperCase() === currentAssignment.vehicleNumber.trim().toUpperCase())
    ) || vehicleMasters[0] || null;
  }, [currentAssignment, vehicleMasters]);

  const assignedRoute = useMemo(() => {
    if (!currentAssignment) return routeMasters[0] || null;
    return routeMasters.find(r =>
      (currentAssignment.routeId && String(r.id).trim() === String(currentAssignment.routeId).trim()) ||
      (currentAssignment.routeName && r.routeName && r.routeName.trim().toLowerCase() === currentAssignment.routeName.trim().toLowerCase())
    ) || routeMasters[0] || null;
  }, [currentAssignment, routeMasters]);

  const routeStopsCount = useMemo(() => {
    const targetRouteId = assignedRoute?.id ? String(assignedRoute.id).trim() : '';
    const targetRouteName = (assignedRoute?.routeName || '').trim().toLowerCase();
    return pickupPoints.filter(p =>
      (p.routeId && targetRouteId && String(p.routeId).trim() === targetRouteId) ||
      (p.routeName && targetRouteName && p.routeName.trim().toLowerCase() === targetRouteName)
    ).length;
  }, [pickupPoints, assignedRoute]);

  // Edit Form State — includes contact and license fields
  const [formData, setFormData] = useState({
    mobile: matchedDriver.mobileNumber || user?.phone || '',
    email: (matchedDriver as any).email || user?.email || '',
    address: (matchedDriver as any).address || '',
    emergencyContact: (matchedDriver as any).emergencyContact || '',
    bloodGroup: (matchedDriver as any).bloodGroup || 'O+',
    licenseNumber: matchedDriver.licenseNumber || '',
    licenseType: (matchedDriver as any).licenseType || 'Commercial (HMV)',
    licenseExpiry: (matchedDriver as any).licenseExpiryDate || '',
    experienceYears: (matchedDriver.experienceYears !== undefined && matchedDriver.experienceYears !== null) ? matchedDriver.experienceYears : 0,
  });

  // Sync formData whenever matchedDriver or saved profile changes
  useEffect(() => {
    try {
      const key = `driver_profile_${matchedDriver.employeeId || 'DRV-001'}`;
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : null;
      setFormData({
        mobile: parsed?.mobile !== undefined ? parsed.mobile : (matchedDriver.mobileNumber || user?.phone || ''),
        email: parsed?.email !== undefined ? parsed.email : ((matchedDriver as any).email || user?.email || ''),
        address: parsed?.address !== undefined ? parsed.address : ((matchedDriver as any).address || ''),
        emergencyContact: parsed?.emergencyContact !== undefined ? parsed.emergencyContact : ((matchedDriver as any).emergencyContact || ''),
        bloodGroup: parsed?.bloodGroup !== undefined ? parsed.bloodGroup : ((matchedDriver as any).bloodGroup || 'O+'),
        licenseNumber: parsed?.licenseNumber !== undefined ? parsed.licenseNumber : (matchedDriver.licenseNumber || ''),
        licenseType: parsed?.licenseType !== undefined ? parsed.licenseType : ((matchedDriver as any).licenseType || 'Commercial (HMV)'),
        licenseExpiry: parsed?.licenseExpiry !== undefined ? parsed.licenseExpiry : ((matchedDriver as any).licenseExpiryDate || ''),
        experienceYears: parsed?.experienceYears !== undefined ? parsed.experienceYears : (matchedDriver.experienceYears !== undefined ? matchedDriver.experienceYears : 0),
      });
    } catch (e) {}
  }, [matchedDriver, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedExp = formData.experienceYears === '' ? 0 : Number(formData.experienceYears) || 0;
      const dataToSave = {
        ...formData,
        experienceYears: parsedExp,
      };

      // Save contact details + license details to localStorage
      localStorage.setItem(`driver_profile_${matchedDriver.employeeId || 'DRV-001'}`, JSON.stringify(dataToSave));

      // Also update DriverMaster via DataContext for persistence
      if (matchedDriver?.id && updateDriverMaster) {
        await updateDriverMaster(String(matchedDriver.id), {
          licenseNumber: formData.licenseNumber,
          licenseExpiryDate: formData.licenseExpiry,
          licenseType: formData.licenseType,
          experienceYears: parsedExp,
          mobileNumber: formData.mobile,
          email: formData.email,
          address: formData.address,
          emergencyContact: formData.emergencyContact,
        });
      }

      addToast('success', 'Profile Updated', 'Driver profile and license details saved successfully.');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      addToast('error', 'Update Failed', 'Could not save profile changes.');
    }
  };

  const inputClass = "w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none";

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl border border-sky-200/90 dark:border-sky-850 bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {matchedDriver.driverName?.charAt(0) || 'D'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Active Staff" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {matchedDriver.driverName}
                </h2>
                <Badge variant="success" size="sm">Active Staff</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                ID: {matchedDriver.employeeId || 'STF-2026-0003'} • Department: {(matchedDriver as any).department || 'Transport Dept'}
              </p>
              <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                Designation: {(matchedDriver as any).designation || 'Driver'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
          >
            {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Form Grid */}
      <form onSubmit={handleSaveProfile}>
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
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formData.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Official Email</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formData.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Residential Address</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formData.address || '—'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
                    <span className="font-black text-rose-600">{formData.bloodGroup || matchedDriver.bloodGroup || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.emergencyContact || matchedDriver.emergencyContact || '—'}</span>
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
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className={inputClass + ' cursor-pointer'}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
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
                    {formData.licenseNumber || matchedDriver.licenseNumber || '—'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="success" size="sm">Verified {formData.licenseType || 'Commercial (HMV)'}</Badge>
                    <span className="text-[10px] text-slate-400">Exp: {formData.licenseExpiry || '2030-12-31'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
                  <span className="font-black text-sm text-sky-600">{(formData.experienceYears !== undefined && formData.experienceYears !== '') ? formData.experienceYears : (matchedDriver.experienceYears || 0)} Years</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Driving License Number</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className={inputClass + ' font-mono'}
                    placeholder="e.g. DL-2026-0073"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">License Type</label>
                    <select
                      value={formData.licenseType}
                      onChange={e => setFormData({ ...formData, licenseType: e.target.value })}
                      className={inputClass + ' cursor-pointer'}
                    >
                      <option value="Commercial (HMV)">Commercial (HMV)</option>
                      <option value="Heavy Motor Vehicle">Heavy Motor Vehicle</option>
                      <option value="Light Motor Vehicle">Light Motor Vehicle (LMV)</option>
                      <option value="Transport Vehicle">Transport Vehicle</option>
                      <option value="Commercial (LMV)">Commercial (LMV)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">License Expiry</label>
                    <input
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={e => setFormData({ ...formData, licenseExpiry: e.target.value })}
                      className={inputClass}
                      required
                    />
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
                      setFormData({ ...formData, experienceYears: val === '' ? '' : val });
                    }}
                    className={inputClass}
                    placeholder="e.g. 5"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save License Changes</span>
                </button>
              </div>
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
                  <span>Stops: <span className="font-bold text-slate-700 dark:text-slate-300">{routeStopsCount || 0}</span></span>
                  <span>Distance: <span className="font-bold text-slate-700 dark:text-slate-300">{assignedRoute?.totalDistanceKm ? `${assignedRoute.totalDistanceKm} km` : 'N/A'}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
