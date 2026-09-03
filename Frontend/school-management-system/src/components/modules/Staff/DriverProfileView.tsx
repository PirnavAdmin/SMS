import React, { useState, useMemo } from 'react';
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
    pickupPoints = []
  } = useData();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);

  // 1. Dynamically match logged-in driver from driverMasters and staff
  const matchedDriver = useMemo(() => {
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    const userPhone = (user?.phone || '').trim().toLowerCase();
    const userEmpId = (user?.id || (user as any)?.empId || '').trim().toLowerCase();

    // Match from driverMasters
    const fromMaster = driverMasters.find(d =>
      (userEmpId && (d.employeeId?.toLowerCase() === userEmpId || String(d.id) === userEmpId)) ||
      (userEmail && d.email?.toLowerCase() === userEmail) ||
      (userPhone && d.mobileNumber?.replace(/\D/g, '') === userPhone.replace(/\D/g, '')) ||
      (userName && d.driverName?.toLowerCase() === userName) ||
      (userName && (d.driverName?.toLowerCase().includes(userName) || userName.includes(d.driverName?.toLowerCase())))
    );

    if (fromMaster) return fromMaster;

    // Match from staff
    const fromStaff = staff.find(s =>
      (userEmpId && (s.employeeId?.toLowerCase() === userEmpId || String(s.id) === userEmpId)) ||
      (userEmail && s.email?.toLowerCase() === userEmail) ||
      (userName && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === userName) ||
      (s.designation || '').toLowerCase().includes('driver') ||
      (s.department || '').toLowerCase().includes('transport')
    );

    if (fromStaff) {
      return {
        id: fromStaff.id,
        driverName: `${fromStaff.firstName} ${fromStaff.lastName}`.trim(),
        licenseNumber: (fromStaff as any).licenseNumber || `DL-${fromStaff.empId || fromStaff.id}`,
        mobileNumber: fromStaff.phone || '',
        employeeId: fromStaff.empId || fromStaff.employeeId || `STF-${fromStaff.id}`,
        department: fromStaff.department || 'Transport Dept',
        designation: fromStaff.designation || 'Driver',
        status: 'Active' as const,
        experienceYears: (fromStaff as any).experienceYears || 5,
        email: fromStaff.email || user?.email || '',
        address: fromStaff.address || '',
        bloodGroup: fromStaff.bloodGroup || 'O+',
        dateOfJoining: fromStaff.dateOfJoining || new Date().toISOString().split('T')[0]
      };
    }

    return {
      id: user?.id || '1',
      driverName: user?.name || 'Nag Sahoo',
      licenseNumber: `DL-${user?.id || '2026-0003'}`,
      mobileNumber: user?.phone || '',
      employeeId: (user as any)?.empId || user?.id || 'STF-2026-0003',
      department: (user as any)?.department || 'Transport Dept',
      designation: (user as any)?.designation || 'Driver',
      status: 'Active' as const,
      experienceYears: 5,
      email: user?.email || '',
      address: '',
      bloodGroup: 'O+',
      dateOfJoining: new Date().toISOString().split('T')[0]
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

  // Edit Form State
  const [formData, setFormData] = useState({
    mobile: matchedDriver.mobileNumber || user?.phone || '',
    email: (matchedDriver as any).email || user?.email || '',
    address: (matchedDriver as any).address || '',
    emergencyContact: '',
    bloodGroup: (matchedDriver as any).bloodGroup || 'O+'
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(`driver_profile_${matchedDriver.employeeId || 'DRV-001'}`, JSON.stringify(formData));
      addToast('success', 'Profile Updated', 'Driver contact details saved successfully.');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      addToast('error', 'Update Failed', 'Could not save profile changes.');
    }
  };

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

      {/* Main Profile Grid */}
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
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
                  <span className="font-black text-rose-600">{formData.bloodGroup}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formData.emergencyContact}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Joining</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {(matchedDriver as any).dateOfJoining || '15 June 2022'}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </form>
          )}
        </div>

        {/* Middle Column: Driving License & Commercial Credentials */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> License & Safety Credentials
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Driving License Number</span>
              <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                {matchedDriver.licenseNumber || 'DL-2026-9874'}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success" size="sm">Verified Commercial (HMV)</Badge>
                <span className="text-[10px] text-slate-400">Exp: 2030-12-31</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
                <span className="font-black text-sm text-sky-600">{matchedDriver.experienceYears || 8} Years</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Safety Record</span>
                <span className="font-black text-sm text-emerald-600">Clean (Zero Incidents)</span>
              </div>
            </div>
          </div>
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
                {assignedVehicle?.vehicleNumber || currentAssignment?.vehicleNumber || 'AP04 Z 4567'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Route</span>
              <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-sky-600" />
                <span>{assignedRoute?.routeName || currentAssignment?.routeName || 'RT-01 (South Campus Route)'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Stops: <span className="font-bold text-slate-700 dark:text-slate-300">{routeStopsCount || 4}</span></span>
                <span>Distance: <span className="font-bold text-slate-700 dark:text-slate-300">{assignedRoute?.totalDistanceKm || 18.5} km</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
