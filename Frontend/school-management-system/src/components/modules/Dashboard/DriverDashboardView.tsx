// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import {
  Bus, MapPin, Users, Phone, ShieldCheck, Clock, Navigation,
  CheckCircle2, AlertCircle, Signal, UserCheck, Calendar,
  ArrowRight, Radio, Search, ChevronRight, PhoneCall, Sparkles,
  LogIn, LogOut, FileText, Plus, CalendarCheck, X, Send, Check,
  Activity, Layers
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { teacherCheckInApi, teacherCheckOutApi, fetchTeacherTodayAttendanceApi } from '../../../api/attendance';
import { LeaveApplication, LeaveType } from '../../../types';

interface DriverDashboardViewProps {
  onNavigate: (module: string) => void;
}

const formatTripTime = (value?: string) => {
  if (!value) return 'Not set';
  if (value.includes('AM') || value.includes('PM')) return value;

  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
};

export const DriverDashboardView: React.FC<DriverDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const {
    students = [],
    staff = [],
    vehicleAssignments = [],
    vehicleMasters = [],
    driverMasters = [],
    routeMasters = [],
    pickupPoints = [],
    busAttendants = [],
    studentTransports = [],
    academicClasses = [],
    admissions = [],
    attendance = [],
    markAttendance
  } = useData();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStopFilter, setSelectedStopFilter] = useState('All');
  const [boardedMap, setBoardedMap] = useState<Record<string, boolean>>({});

  // 1. Identify logged-in Driver or Bus Attendant
  const matchedDriver = useMemo(() => {
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    const userPhone = (user?.phone || '').trim().toLowerCase();
    const userEmpId = (user?.id || (user as any)?.empId || (user as any)?.employeeId || '').trim().toLowerCase();

    // Priority 1: Match from busAttendants (if user is registered as an attendant)
    const fromAttendant = (() => {
      if (userEmpId) {
        const byEmpId = busAttendants.find(a => (a.employeeId?.toLowerCase() === userEmpId || String(a.id) === userEmpId));
        if (byEmpId) return byEmpId;
      }
      if (userPhone && userPhone.length >= 10) {
        const cleanPhone = userPhone.slice(-10);
        const byPhone = busAttendants.find(a => (a.mobileNumber || '').replace(/\D/g, '').endsWith(cleanPhone));
        if (byPhone) return byPhone;
      }
      if (userName && userName !== 'user' && userName !== 'administrator') {
        const byName = busAttendants.find(a => {
          const aName = (a.attendantName || '').trim().toLowerCase();
          return aName === userName || (userName.length >= 3 && (aName.includes(userName) || userName.includes(aName)));
        });
        if (byName) return byName;
      }
      return null;
    })();

    if (fromAttendant) {
      return {
        id: fromAttendant.id,
        driverName: fromAttendant.attendantName || user?.name || 'Bus Attendant',
        licenseNumber: '',
        mobileNumber: fromAttendant.mobileNumber || user?.phone || '',
        employeeId: fromAttendant.employeeId || userEmpId || '',
        status: fromAttendant.status || ('Active' as const),
        experienceYears: 0,
        isAttendant: true,
        designation: 'Bus Attendant'
      };
    }

    // Priority 2: Match from driverMasters by exact user email
    const fromMaster = (() => {
      if (userEmail) {
        const byEmail = driverMasters.find(d => d.email && d.email.toLowerCase().trim() === userEmail);
        if (byEmail) return byEmail;
      }
      if (userEmpId) {
        const byEmpId = driverMasters.find(d => (d.employeeId?.toLowerCase() === userEmpId || String(d.id) === userEmpId));
        if (byEmpId) return byEmpId;
      }
      if (userPhone && userPhone.length >= 10) {
        const cleanPhone = userPhone.slice(-10);
        const byPhone = driverMasters.find(d => (d.mobileNumber || '').replace(/\D/g, '').endsWith(cleanPhone));
        if (byPhone) return byPhone;
      }
      if (userName && userName !== 'user' && userName !== 'administrator') {
        const byName = driverMasters.find(d => {
          const dName = (d.driverName || '').trim().toLowerCase();
          const matches = dName === userName || dName.includes(userName) || userName.includes(dName);
          if (!matches) return false;
          if (userEmail && d.email && d.email.toLowerCase().trim() !== userEmail) {
            return d.email.toLowerCase().includes('gamal.com') || d.email.toLowerCase().replace(/@.*/, '') === userEmail.replace(/@.*/, '');
          }
          return true;
        });
        if (byName) return byName;
      }
      return null;
    })();

    if (fromMaster) {
      return {
        ...fromMaster,
        driverName: fromMaster.driverName || user?.name || 'Driver',
        isAttendant: false,
        designation: 'Driver'
      };
    }

    // Priority 3: Try matching in staff prioritizing exact user email
    const fromStaff = (() => {
      if (userEmail) {
        const byEmail = staff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
        if (byEmail) return byEmail;
      }
      if (userEmpId) {
        const byEmpId = staff.find(s => {
          const sEmpId = (s.empId || (s as any).employeeId || String(s.id)).toLowerCase();
          return sEmpId === userEmpId;
        });
        if (byEmpId) return byEmpId;
      }
      if (userPhone && userPhone.length >= 10) {
        const cleanPhone = userPhone.slice(-10);
        const byPhone = staff.find(s => (s.phone || (s as any).mobileNumber || '').replace(/\D/g, '').endsWith(cleanPhone));
        if (byPhone) return byPhone;
      }
      if (userName && userName !== 'user' && userName !== 'administrator') {
        const byName = staff.find(s => {
          const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
          const sName = (s.name || '').trim().toLowerCase();
          const matches = sFullName === userName || sName === userName || sFullName.includes(userName) || userName.includes(sFullName);
          if (!matches) return false;
          if (userEmail && s.email && s.email.toLowerCase().trim() !== userEmail) {
            return s.email.toLowerCase().includes('gamal.com') || s.email.toLowerCase().replace(/@.*/, '') === userEmail.replace(/@.*/, '');
          }
          return true;
        });
        if (byName) return byName;
      }
      return null;
    })();

    if (fromStaff) {
      const staffName = `${fromStaff.firstName || ''} ${fromStaff.lastName || ''}`.trim() || fromStaff.name;
      const des = (fromStaff.designation || '').toLowerCase();
      const roleStr = ((fromStaff as any).role || (fromStaff as any).employeeCategory || '').toLowerCase();
      const isAtt = des.includes('attendant') || des.includes('conductor') || des.includes('helper') || roleStr.includes('attendant');
      return {
        id: fromStaff.id,
        driverName: staffName || user?.name || (isAtt ? 'Bus Attendant' : 'Driver'),
        licenseNumber: (fromStaff as any).licenseNumber || (fromStaff as any).licenceNumber || '',
        mobileNumber: fromStaff.phone || (fromStaff as any).mobileNumber || user?.phone || '',
        employeeId: fromStaff.empId || (fromStaff as any).employeeId || String(fromStaff.id) || '',
        status: fromStaff.status || ('Active' as const),
        experienceYears: (fromStaff as any).experienceYears !== undefined ? (fromStaff as any).experienceYears : 0,
        isAttendant: isAtt,
        designation: isAtt ? 'Bus Attendant' : (fromStaff.designation || 'Driver')
      };
    }

    const isAttendantFallback = Boolean(
      (user as any)?.designation?.toLowerCase().includes('attendant') ||
      vehicleAssignments.some(va => {
        const vaAtt = (va.attendantName || '').toLowerCase().trim();
        return userName && vaAtt === userName;
      })
    );

    return {
      id: user?.id || '1',
      driverName: user?.name || (isAttendantFallback ? 'Bus Attendant' : 'Driver'),
      licenseNumber: (user as any)?.licenseNumber || '',
      mobileNumber: user?.phone || (user as any)?.mobileNumber || '',
      employeeId: (user as any)?.empId || (user as any)?.employeeId || user?.id || '',
      status: 'Active' as const,
      experienceYears: 0,
      isAttendant: isAttendantFallback,
      designation: isAttendantFallback ? 'Bus Attendant' : 'Driver'
    };
  }, [user, busAttendants, driverMasters, staff, vehicleAssignments]);

  // 2. Resolve Active Vehicle Assignment for this Driver OR Bus Attendant
  const currentAssignment = useMemo(() => {
    const userId = String(matchedDriver.id).trim();
    const personName = (matchedDriver.driverName || user?.name || '').trim().toLowerCase();
    const personEmpId = (matchedDriver.employeeId || (user as any)?.empId || '').trim().toLowerCase();

    const matched = vehicleAssignments.find(va => {
      const isActive = va.status === 'Active' || (va.status as any) === true || String(va.status).toLowerCase() === 'true';
      if (!isActive) return false;

      // Check Driver match
      const vaDriverId = String(va.driverId || '').trim();
      const vaDriverName = (va.driverName || '').trim().toLowerCase();
      const vaDriverEmpId = (va.driverEmployeeId || '').trim().toLowerCase();
      const isDriverMatch = (
        (userId && vaDriverId === userId) ||
        (personName && vaDriverName === personName) ||
        (personEmpId && vaDriverEmpId === personEmpId)
      );

      // Check Attendant match
      const vaAttId = String(va.attendantId || '').trim();
      const vaAttName = (va.attendantName || '').trim().toLowerCase();
      const vaAttEmpId = (va.attendantEmployeeId || '').trim().toLowerCase();
      const isAttendantMatch = (
        (userId && vaAttId === userId) ||
        (personName && vaAttName === personName) ||
        (personEmpId && vaAttEmpId === personEmpId)
      );

      return isDriverMatch || isAttendantMatch;
    });

    return matched || null;
  }, [matchedDriver, user, vehicleAssignments]);

  // 3. Resolve Vehicle, Route & Attendant Details
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

  const targetRouteId = assignedRoute?.id ? String(assignedRoute.id).trim() : (currentAssignment?.routeId ? String(currentAssignment.routeId).trim() : '');
  const targetRouteName = (assignedRoute?.routeName || currentAssignment?.routeName || '').trim().toLowerCase();
  const targetRouteCode = (assignedRoute?.routeCode || '').trim().toLowerCase();

  // 4. Resolve Bus Attendant
  const assignedAttendant = useMemo(() => {
    if (!currentAssignment) return { name: 'Unassigned', employeeId: '-', mobile: '-' };

    const attendant = busAttendants.find(a =>
      (currentAssignment.attendantId && (String(a.id) === String(currentAssignment.attendantId) || a.employeeId === currentAssignment.attendantId)) ||
      (currentAssignment.attendantEmployeeId && a.employeeId === currentAssignment.attendantEmployeeId) ||
      (currentAssignment.attendantName && a.attendantName?.trim().toLowerCase() === currentAssignment.attendantName?.trim().toLowerCase())
    );

    const matchedStaff = staff.find(s => {
      const staffFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const attName = (currentAssignment.attendantName || attendant?.attendantName || '').trim().toLowerCase();
      const staffEmpId = (s.empId || (s as any).employeeId || String(s.id) || '').trim().toLowerCase();
      const targetEmpId = (attendant?.employeeId || currentAssignment.attendantEmployeeId || currentAssignment.attendantId || '').trim().toLowerCase();

      return (
        (targetEmpId && (staffEmpId === targetEmpId || String(s.id).toLowerCase() === targetEmpId)) ||
        (attName && (staffFullName === attName || staffFullName.includes(attName) || attName.includes(staffFullName)))
      );
    });

    const name = (currentAssignment.attendantName && currentAssignment.attendantName.toUpperCase() !== 'UNASSIGNED' && currentAssignment.attendantName.trim() !== '')
      ? currentAssignment.attendantName
      : (attendant?.attendantName || (matchedStaff ? `${matchedStaff.firstName} ${matchedStaff.lastName || ''}`.trim() : 'Unassigned'));

    let empCode = currentAssignment.attendantEmployeeId || attendant?.employeeId || matchedStaff?.empId || (matchedStaff as any)?.employeeId || (matchedStaff?.id ? `STF-${matchedStaff.id}` : '-');
    const mobile = currentAssignment.attendantMobile || attendant?.mobileNumber || matchedStaff?.phone || (matchedStaff as any)?.mobileNumber || '-';

    return {
      name,
      employeeId: empCode,
      mobile
    };
  }, [currentAssignment, busAttendants, staff]);

  // 4b. Resolve Assigned Driver (when current user is the Bus Attendant)
  const assignedDriver = useMemo(() => {
    if (!currentAssignment) return { name: 'Unassigned', employeeId: '-', mobile: '-' };

    const driver = driverMasters.find(d =>
      (currentAssignment.driverId && (String(d.id) === String(currentAssignment.driverId) || d.employeeId === currentAssignment.driverId)) ||
      (currentAssignment.driverEmployeeId && d.employeeId === currentAssignment.driverEmployeeId) ||
      (currentAssignment.driverName && d.driverName?.trim().toLowerCase() === currentAssignment.driverName?.trim().toLowerCase())
    );

    const matchedStaff = staff.find(s => {
      const staffFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const dName = (currentAssignment.driverName || driver?.driverName || '').trim().toLowerCase();
      const staffEmpId = (s.empId || (s as any).employeeId || String(s.id) || '').trim().toLowerCase();
      const targetEmpId = (driver?.employeeId || currentAssignment.driverEmployeeId || currentAssignment.driverId || '').trim().toLowerCase();

      return (
        (targetEmpId && (staffEmpId === targetEmpId || String(s.id).toLowerCase() === targetEmpId)) ||
        (dName && (staffFullName === dName || staffFullName.includes(dName) || dName.includes(staffFullName)))
      );
    });

    const name = (currentAssignment.driverName && currentAssignment.driverName.toUpperCase() !== 'UNASSIGNED' && currentAssignment.driverName.trim() !== '')
      ? currentAssignment.driverName
      : (driver?.driverName || (matchedStaff ? `${matchedStaff.firstName} ${matchedStaff.lastName || ''}`.trim() : 'Unassigned'));

    let empCode = currentAssignment.driverEmployeeId || driver?.employeeId || matchedStaff?.empId || (matchedStaff as any)?.employeeId || (matchedStaff?.id ? `DRV-${matchedStaff.id}` : '-');
    const mobile = currentAssignment.driverMobile || driver?.mobileNumber || matchedStaff?.phone || (matchedStaff as any)?.mobileNumber || '-';

    return {
      name,
      employeeId: empCode,
      mobile
    };
  }, [currentAssignment, driverMasters, staff]);

  // 4c. Check if active user is acting as Bus Attendant
  const isUserAttendant = useMemo(() => {
    if (matchedDriver.isAttendant) return true;
    const personName = (matchedDriver.driverName || user?.name || '').trim().toLowerCase();
    const personEmpId = (matchedDriver.employeeId || (user as any)?.empId || '').trim().toLowerCase();
    if (currentAssignment) {
      const vaAttName = (currentAssignment.attendantName || '').trim().toLowerCase();
      const vaAttEmpId = (currentAssignment.attendantEmployeeId || '').trim().toLowerCase();
      if (personName && vaAttName === personName) return true;
      if (personEmpId && vaAttEmpId === personEmpId) return true;
    }
    return false;
  }, [matchedDriver, user, currentAssignment]);

  // 5. Route Pickup Stops
  const routeStops = useMemo(() => {
    if (!targetRouteId && !targetRouteName) return [];
    return pickupPoints
      .filter(p =>
        (p.routeId && targetRouteId && String(p.routeId).trim() === targetRouteId) ||
        (p.routeName && targetRouteName && p.routeName.trim().toLowerCase() === targetRouteName)
      )
      .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
  }, [pickupPoints, targetRouteId, targetRouteName]);

  // 6. STRICTLY Assigned Students for this Driver's Bus / Route
  const assignedStudents = useMemo(() => {
    const studentMap = new Map<string, any>();
    const hasValidRoute = (targetRouteName !== '' && targetRouteName !== 'unassigned' && targetRouteName !== 'n/a') || targetRouteId !== '';
    if (!hasValidRoute) return [];

    // 1. From studentTransports
    studentTransports.forEach(st => {
      const isStatusActive = st.status === 'Active' || (st.status as any) === true || String(st.status).toLowerCase() === 'true';
      if (!isStatusActive) return;

      const stRouteId = String(st.routeId || '').trim();
      const stRouteName = (st.routeName || '').trim().toLowerCase();

      const matchRt = Boolean(
        (targetRouteId && stRouteId && stRouteId === targetRouteId) ||
        (targetRouteName && stRouteName && (stRouteName === targetRouteName || (targetRouteCode && stRouteName === targetRouteCode)))
      );

      if (!matchRt) return;

      const targetAdmNo = String(st.admissionNo || '').trim().toLowerCase();
      const targetStuId = String(st.studentId || '').trim().toLowerCase();
      const targetDigits = (targetAdmNo || targetStuId).replace(/\D/g, '');
      const last4Digits = targetDigits.length >= 4 ? targetDigits.slice(-4) : targetDigits;

      const student = students.find(s => {
        const sId = String(s.id || '').trim().toLowerCase();
        const sStuId = String(s.studentId || (s as any).studentId || '').trim().toLowerCase();
        const sAdmNo = String(s.admissionNo || '').trim().toLowerCase();
        const sRollNo = String(s.rollNo || (s as any).rollNumber || '').trim().toLowerCase();
        const sRegNo = String(s.registrationNo || (s as any).registrationNumber || '').trim().toLowerCase();

        if (targetStuId && (sId === targetStuId || sStuId === targetStuId || sAdmNo === targetStuId || sRollNo === targetStuId)) return true;
        if (targetAdmNo && (sAdmNo === targetAdmNo || sRollNo === targetAdmNo || sRegNo === targetAdmNo || sStuId === targetAdmNo || sId === targetAdmNo)) return true;
        if (last4Digits && last4Digits.length >= 3) {
          const sAdmDigits = sAdmNo.replace(/\D/g, '');
          const sRollDigits = sRollNo.replace(/\D/g, '');
          const sIdDigits = sId.replace(/\D/g, '');
          const sStuDigits = sStuId.replace(/\D/g, '');
          if (
            (sAdmDigits && (sAdmDigits.endsWith(last4Digits) || sAdmDigits === last4Digits)) ||
            (sRollDigits && (sRollDigits.endsWith(last4Digits) || sRollDigits === last4Digits)) ||
            (sIdDigits && (sIdDigits.endsWith(last4Digits) || sIdDigits === last4Digits)) ||
            (sStuDigits && (sStuDigits.endsWith(last4Digits) || sStuDigits === last4Digits))
          ) {
            return true;
          }
        }
        return false;
      });

      const matchedAdm = admissions.find(a => {
        const aId = String(a.id || '').trim().toLowerCase();
        const aAppNo = String(a.applicationNo || (a as any).applicationId || '').trim().toLowerCase();
        const aRegNo = String(a.registrationNo || (a as any).registrationNumber || '').trim().toLowerCase();
        const aAdmNo = String((a as any).admissionNo || (a as any).admissionNumber || '').trim().toLowerCase();
        const aStuId = String((a as any).studentId || '').trim().toLowerCase();
        const aRollNo = String(a.rollNo || (a as any).rollNumber || '').trim().toLowerCase();

        if (targetStuId && (aId === targetStuId || aStuId === targetStuId || aAdmNo === targetStuId || aRollNo === targetStuId || aRegNo === targetStuId)) return true;
        if (targetAdmNo && (aAdmNo === targetAdmNo || aRegNo === targetAdmNo || aAppNo === targetAdmNo || aRollNo === targetAdmNo || aStuId === targetAdmNo || aId === targetAdmNo)) return true;
        if (last4Digits && last4Digits.length >= 3) {
          const aAdmDigits = aAdmNo.replace(/\D/g, '');
          const aRegDigits = aRegNo.replace(/\D/g, '');
          const aRollDigits = aRollNo.replace(/\D/g, '');
          const aStuDigits = aStuId.replace(/\D/g, '');
          if (
            (aAdmDigits && (aAdmDigits.endsWith(last4Digits) || aAdmDigits === last4Digits)) ||
            (aRegDigits && (aRegDigits.endsWith(last4Digits) || aRegDigits === last4Digits)) ||
            (aRollDigits && (aRollDigits.endsWith(last4Digits) || aRollDigits === last4Digits)) ||
            (aStuDigits && (aStuDigits.endsWith(last4Digits) || aStuDigits === last4Digits))
          ) {
            return true;
          }
        }
        return false;
      });

      const key = String(student?.id || st.studentId || student?.admissionNo || st.admissionNo || st.id);
      const fullName = (
        student?.studentName ||
        student?.name ||
        `${student?.firstName || ''} ${student?.lastName || ''}`.trim() ||
        matchedAdm?.applicantName ||
        `${matchedAdm?.firstName || ''} ${matchedAdm?.lastName || ''}`.trim() ||
        (st.studentName && st.studentName !== 'Student Passenger' ? st.studentName : '') ||
        'Student Passenger'
      ).trim();

      const resolvedClassName = (
        student?.className ||
        student?.grade ||
        academicClasses.find(c => String(c.id) === String(student?.classId))?.name ||
        (academicClasses.find(c => String(c.id) === String(student?.classId)) as any)?.className ||
        matchedAdm?.appliedClass ||
        (matchedAdm as any)?.className ||
        (matchedAdm as any)?.targetClass ||
        (st as any)?.className ||
        ''
      ).trim();

      const resolvedSection = (
        student?.section ||
        (student as any)?.sectionName ||
        matchedAdm?.section ||
        (st as any)?.section ||
        (st as any)?.sectionName ||
        ''
      ).replace(/^Section\s*/i, '').trim();

      const pName = (
        student?.fatherName ||
        (student as any)?.fatherFullName ||
        student?.parentName ||
        matchedAdm?.parentName ||
        matchedAdm?.fatherName ||
        (st as any)?.parentName ||
        (st as any)?.fatherName ||
        (student as any)?.guardianName ||
        student?.motherName ||
        matchedAdm?.motherName ||
        'Parent / Guardian'
      ).trim();

      const pMobile = (
        student?.fatherPhone ||
        (student as any)?.fatherMobile ||
        (student as any)?.fatherMobileNo ||
        (student as any)?.fatherContact ||
        student?.parentPhone ||
        (student as any)?.parentContact ||
        student?.phone ||
        (student as any)?.mobileNumber ||
        matchedAdm?.phone ||
        matchedAdm?.fatherMobile ||
        (st as any)?.parentMobile ||
        (st as any)?.fatherMobile ||
        '+91-9878645500'
      ).trim();

      const rawPoint = st.pickupPoint || student?.pickupPoint || matchedAdm?.pickupPoint;
      const pPoint = (rawPoint && rawPoint.trim() !== '' && rawPoint.trim().toUpperCase() !== 'N/A' && rawPoint !== 'Default Stop')
        ? rawPoint.trim()
        : (routeStops.length > 0 ? routeStops[0].pickupName : 'Main Gate Stop');

      const studentIdVal =
        student?.rollNo ||
        (student as any)?.rollNumber ||
        (st.admissionNo && st.admissionNo.toUpperCase().startsWith('STU') ? st.admissionNo : '') ||
        (student as any)?.studentId ||
        (st.studentId && st.studentId !== '0' && st.studentId !== '' ? (String(st.studentId).startsWith('STU') ? String(st.studentId) : `STU-${st.studentId}`) : '') ||
        (matchedAdm as any)?.studentId ||
        (matchedAdm as any)?.rollNo ||
        (student?.admissionNo && student.admissionNo.toUpperCase().startsWith('STU') ? student.admissionNo : '') ||
        (student?.id ? (String(student.id).startsWith('STU') ? String(student.id) : `STU-${student.id}`) : '') ||
        st.admissionNo ||
        '-';

      studentMap.set(key, {
        id: student?.id || st.studentId || key,
        studentId: studentIdVal,
        admissionNo: student?.admissionNo || st.admissionNo || matchedAdm?.registrationNo || matchedAdm?.applicationNo || '-',
        studentName: fullName,
        gender: student?.gender || matchedAdm?.gender || '',
        className: resolvedClassName,
        section: resolvedSection,
        rollNo: student?.rollNo || (student as any)?.rollNumber || matchedAdm?.rollNo || (st as any)?.rollNo || '-',
        pickupPoint: pPoint,
        parentName: pName,
        parentMobile: pMobile
      });
    });

    // 2. From students profile
    students.forEach(student => {
      const stStatus = (student.status || '').toLowerCase();
      if (stStatus === 'inactive' || stStatus === 'discontinued' || stStatus === 'transferred' || stStatus === 'withdrawn') {
        return;
      }

      const key = String(student.id || student.admissionNo);
      if (studentMap.has(key)) return;

      const otherAssignment = studentTransports.find(st => {
        const isActive = st.status === 'Active' || (st.status as any) === true || String(st.status).toLowerCase() === 'true';
        if (!isActive) return false;
        return (
          (st.studentId && student.id && String(st.studentId).trim() === String(student.id).trim()) ||
          (st.admissionNo && student.admissionNo && String(student.admissionNo).trim().toLowerCase() === String(student.admissionNo).trim().toLowerCase())
        );
      });
      if (otherAssignment) return;

      const matchedAdm = admissions.find(a =>
        (a.registrationNo && student.admissionNo && a.registrationNo.trim().toLowerCase() === student.admissionNo.trim().toLowerCase()) ||
        (a.applicationNo && student.admissionNo && a.applicationNo.trim().toLowerCase() === student.admissionNo.trim().toLowerCase()) ||
        (a.id && student.id && String(a.id).trim() === String(student.id).trim())
      );

      const studRoute = (student.busRoute || matchedAdm?.busRoute || '').trim().toLowerCase();
      const studRouteId = String(student.routeId || '').trim();

      const matchProfileRt = Boolean(
        (targetRouteId && studRouteId && studRouteId === targetRouteId) ||
        (targetRouteId && studRoute && studRoute === targetRouteId) ||
        (targetRouteName && studRoute && (studRoute === targetRouteName || (targetRouteCode && studRoute === targetRouteCode)))
      );

      if (matchProfileRt) {
        const fullName = (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || matchedAdm?.applicantName || 'Student Passenger').trim();
        const pName = (student.fatherName || (student as any)?.fatherFullName || student.parentName || matchedAdm?.parentName || (student as any)?.guardianName || student.motherName || matchedAdm?.motherName || 'Parent / Guardian').trim();
        const pMobile = (
          student.fatherPhone ||
          (student as any)?.fatherMobile ||
          (student as any)?.fatherMobileNo ||
          (student as any)?.fatherContact ||
          student.parentPhone ||
          (student as any)?.parentContact ||
          student.phone ||
          (student as any)?.mobileNumber ||
          matchedAdm?.phone ||
          '+91-9878645500'
        ).trim();

        const rawPoint = student.pickupPoint || matchedAdm?.pickupPoint;
        const pPoint = (rawPoint && rawPoint.trim() !== '' && rawPoint.trim().toUpperCase() !== 'N/A' && rawPoint !== 'Default Stop')
          ? rawPoint.trim()
          : (routeStops.length > 0 ? routeStops[0].pickupName : 'Main Gate Stop');

        studentMap.set(key, {
          id: student.id,
          admissionNo: student.admissionNo || matchedAdm?.registrationNo || '-',
          studentName: fullName,
          gender: student.gender || matchedAdm?.gender || '',
          className: student.className || matchedAdm?.appliedClass || '',
          section: student.section || '',
          rollNo: student.rollNo || '',
          pickupPoint: pPoint,
          parentName: pName,
          parentMobile: pMobile
        });
      }
    });

    return Array.from(studentMap.values());
  }, [students, studentTransports, admissions, targetRouteId, targetRouteName, targetRouteCode, routeStops]);

  // Filtered students for search / stop selection
  const filteredStudents = useMemo(() => {
    return assignedStudents.filter(s => {
      const matchSearch =
        studentSearch.trim() === '' ||
        s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.parentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.pickupPoint.toLowerCase().includes(studentSearch.toLowerCase());

      const matchStop = selectedStopFilter === 'All' || s.pickupPoint === selectedStopFilter;
      return matchSearch && matchStop;
    });
  }, [assignedStudents, studentSearch, selectedStopFilter]);

  const toggleBoarding = (studentId: string) => {
    setBoardedMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const boardedCount = Object.values(boardedMap).filter(Boolean).length;
  const seatingCapacity = assignedVehicle?.capacity || currentAssignment?.vehicleCapacity || 50;
  const morningTime = formatTripTime(currentAssignment?.morningTripTime || '07:00');
  const eveningTime = formatTripTime(currentAssignment?.eveningTripTime || '15:45');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="space-y-4 sm:space-y-4.5 animate-in fade-in max-w-7xl mx-auto pb-12">
      {/* Welcome Banner with School Illustration (Transparent / Admin Standard) */}
      <div className="relative flex items-center justify-between text-slate-900 dark:text-white -mb-1">
        {/* Left side: Greeting */}
        <div className="relative z-10 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{greeting}{(user?.name || matchedDriver.driverName || '').trim() ? `, ${(user?.name || matchedDriver.driverName || '').trim()}` : ''}!</span>
              <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
          </div>
        </div>

        {/* Right side: School Building Graphic Illustration with Expanded Panorama Landscape */}
        <div className="relative z-10 shrink-0 pointer-events-none select-none pl-3">
          <svg className="w-36 sm:w-52 md:w-64 h-12 sm:h-14 md:h-16 overflow-visible" viewBox="0 0 280 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sun */}
            <circle cx="248" cy="20" r="14" fill="#FDE68A" opacity="0.85" />
            <circle cx="248" cy="20" r="10" fill="#FBBF24" opacity="0.9" />

            {/* Clouds */}
            <ellipse cx="25" cy="20" rx="14" ry="7" fill="#E0F2FE" opacity="0.7" />
            <ellipse cx="35" cy="16" rx="11" ry="6" fill="#E0F2FE" opacity="0.8" />
            <ellipse cx="140" cy="24" rx="14" ry="7" fill="#E0F2FE" opacity="0.6" />
            <ellipse cx="210" cy="18" rx="12" ry="6" fill="#E0F2FE" opacity="0.7" />

            {/* Left Background Trees */}
            <circle cx="22" cy="80" r="13" fill="#86EFAC" />
            <circle cx="34" cy="74" r="14" fill="#4ADE80" />
            <circle cx="46" cy="76" r="12" fill="#22C55E" />

            {/* Main School Building Base */}
            <rect x="42" y="52" width="76" height="42" rx="3" fill="#FED7AA" stroke="#FDBA74" strokeWidth="1.5" />
            <rect x="64" y="38" width="32" height="56" rx="3" fill="#FFEDD5" stroke="#FDBA74" strokeWidth="1.5" />

            {/* Roof - Side Wings */}
            <path d="M38 52 L80 32 L80 52 Z" fill="#F87171" />
            <path d="M122 52 L80 32 L80 52 Z" fill="#EF4444" />
            
            {/* Central Tower Roof */}
            <polygon points="80,14 58,38 102,38" fill="#DC2626" />
            
            {/* Flagpole & Flag */}
            <line x1="80" y1="14" x2="80" y2="4" stroke="#78716C" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="80,4 93,8 80,12" fill="#EF4444" />

            {/* Central Clock */}
            <circle cx="80" cy="46" r="4.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
            <line x1="80" y1="46" x2="80" y2="43.5" stroke="#475569" strokeWidth="1" strokeLinecap="round" />

            {/* Windows Left Wing */}
            <rect x="48" y="58" width="8" height="10" rx="1.5" fill="#60A5FA" opacity="0.9" />
            <rect x="60" y="58" width="8" height="10" rx="1.5" fill="#60A5FA" opacity="0.9" />
            <rect x="48" y="74" width="8" height="10" rx="1.5" fill="#60A5FA" opacity="0.9" />
            <rect x="60" y="74" width="8" height="10" rx="1.5" fill="#60A5FA" opacity="0.9" />

            {/* Windows Right Wing */}
            <rect x="92" y="58" width="8" height="10" rx="1.5" fill="#60A5FA" opacity="0.9" />
            <rect x="104" y="58" width="8" height="10" rx="1.5" fill="#60A5FA" opacity="0.9" />
            <rect x="92" y="74" width="8" height="10" rx="1.5" fill="#60A5FA" opacity="0.9" />
            <rect x="104" y="74" width="8" height="10" rx="1.5" fill="#60A5FA" opacity="0.9" />

            {/* Main Entrance Door */}
            <path d="M74 94 L74 76 Q80 70 86 76 L86 94 Z" fill="#9A3412" />
            <rect x="78" y="80" width="4" height="14" fill="#FDBA74" opacity="0.5" />

            {/* Steps */}
            <rect x="68" y="94" width="24" height="2.5" rx="1" fill="#E2E8F0" />
            <rect x="64" y="96.5" width="32" height="2.5" rx="1" fill="#CBD5E1" />

            {/* Right Background Trees */}
            <circle cx="118" cy="76" r="12" fill="#22C55E" />
            <circle cx="128" cy="74" r="14" fill="#4ADE80" />
            <circle cx="138" cy="80" r="11" fill="#86EFAC" />

            {/* Ground Line */}
            <line x1="10" y1="99" x2="270" y2="99" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 2. Key Operational Cards (Streamlined & Essential) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Assigned Vehicle */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-200/80 dark:border-sky-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned Bus</span>
            <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600">
              <Bus className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              {assignedVehicle?.vehicleNumber || currentAssignment?.vehicleNumber || 'Unassigned'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Reg: {assignedVehicle?.registrationNumber || assignedVehicle?.vehicleNumber || 'N/A'} • {assignedVehicle?.vehicleType || 'Bus'}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-sky-100 dark:border-sky-900/60 text-[11px] font-bold">
            <span className="text-slate-500">Seating Capacity</span>
            <span className="text-sky-600 dark:text-sky-400 font-mono font-black">{seatingCapacity} Seats</span>
          </div>
        </div>

        {/* Assigned Route */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-200/80 dark:border-sky-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned Route</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <MapPin className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white truncate">
              {assignedRoute?.routeName || currentAssignment?.routeName || 'Unassigned'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {assignedRoute?.routeCode ? `Code: ${assignedRoute.routeCode} • ` : ''}{routeStops.length} Stops
            </div>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-sky-100 dark:border-sky-900/60 text-[11px] font-bold">
            <span className="text-slate-500">Total Distance</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{assignedRoute?.totalDistanceKm !== undefined && assignedRoute?.totalDistanceKm !== null ? `${assignedRoute.totalDistanceKm} km` : '—'}</span>
          </div>
        </div>

        {/* Bus Attendant or Assigned Driver */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-200/80 dark:border-sky-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {isUserAttendant ? 'Assigned Driver' : 'Bus Attendant'}
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white truncate">
              {isUserAttendant ? assignedDriver.name : assignedAttendant.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Emp ID: {isUserAttendant ? (assignedDriver.employeeId || '—') : (assignedAttendant.employeeId || '—')}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-sky-100 dark:border-sky-900/60 text-[11px] font-bold">
            <a
              href={
                (isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile) && (isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile) !== '-'
                  ? `tel:${isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile}`
                  : undefined
              }
              className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold"
            >
              <Phone className="w-3 h-3" /> {(isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile) || '—'}
            </a>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full font-bold">On Duty</span>
          </div>
        </div>
      </div>

      {/* 3. Route Stop Timeline & Manifest */}
      {routeStops.length > 0 && (
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> Route Stops Sequence ({routeStops.length} Stops)
              </h3>
              <p className="text-[11px] text-slate-500">Scheduled pickup sequence for {assignedRoute?.routeName || 'Assigned Route'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {routeStops.map((stop, idx) => {
              const studentsAtThisStop = assignedStudents.filter(s => s.pickupPoint === stop.pickupName).length;
              return (
                <div key={stop.id || idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {stop.morningPickupTime || stop.arrivalTime || morningTime}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate" title={stop.pickupName}>
                    {stop.pickupName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span>{stop.distanceFromSchoolKm !== undefined && stop.distanceFromSchoolKm !== null ? `${stop.distanceFromSchoolKm} km` : '—'}</span>
                    <span className="font-bold text-sky-600">{studentsAtThisStop} Students</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
