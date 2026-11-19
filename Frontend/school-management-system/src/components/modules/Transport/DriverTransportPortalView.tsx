// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import {
  Bus, MapPin, Users, Phone, ShieldCheck, Clock, Navigation,
  CheckCircle2, AlertCircle, Signal, UserCheck, Calendar,
  ArrowRight, Radio, Search, ChevronRight, PhoneCall, RefreshCw, Eye
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { TransportGPSTrackingView } from './TransportGPSTrackingView';
import { VehicleTripDetailsModal } from './VehicleTripDetailsModal';
import { TransportScrollableTabs } from './TransportScrollableTabs';
import { formatMorningTripTime, formatEveningTripTime } from './transportData';
import { Pagination } from '../../common/Pagination';
import { ValidatedSearchInput } from '../../common/ValidatedSearchInput';

interface DriverTransportPortalViewProps {
  onNavigate?: (module: string) => void;
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

export const DriverTransportPortalView: React.FC<DriverTransportPortalViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
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
    admissions = []
  } = useData();

  const [activeTab, setActiveTab] = useState<'my-bus' | 'stops' | 'students' | 'gps'>('my-bus');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStopFilter, setSelectedStopFilter] = useState('All');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [boardedMap, setBoardedMap] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearch, selectedStopFilter]);

  // 1. Identify Driver or Bus Attendant
  const matchedDriver = useMemo(() => {
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    const userPhone = (user?.phone || '').trim().toLowerCase();
    const userEmpId = (user?.id || (user as any)?.empId || (user as any)?.employeeId || '').trim().toLowerCase();

    // Priority 1: Match from busAttendants
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

    // Priority 2: Match from staff
    const fromStaff = staff.find(s => {
      const sEmpId = (s.empId || (s as any).employeeId || '').toLowerCase();
      const sId = String(s.id).toLowerCase();
      const sEmail = (s.email || '').toLowerCase();
      const sPhone = (s.phone || (s as any).mobileNumber || '').replace(/\D/g, '');
      const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const sName = (s.name || '').trim().toLowerCase();

      return (
        (userEmpId && (sEmpId === userEmpId || sId === userEmpId)) ||
        (userEmail && sEmail === userEmail) ||
        (userPhone && sPhone && sPhone === userPhone.replace(/\D/g, '')) ||
        (userName && (sFullName === userName || sName === userName || sFullName.includes(userName) || userName.includes(sFullName)))
      );
    });

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

    // Priority 3: Match from driverMasters
    const fromMaster = driverMasters.find(d =>
      (userEmpId && (d.employeeId?.toLowerCase() === userEmpId || (d as any).empId?.toLowerCase() === userEmpId || String(d.id).toLowerCase() === userEmpId)) ||
      (userEmail && d.email?.toLowerCase() === userEmail) ||
      (userPhone && d.mobileNumber?.replace(/\D/g, '') === userPhone.replace(/\D/g, '')) ||
      (userName && d.driverName?.toLowerCase() === userName) ||
      (userName && (d.driverName?.toLowerCase().includes(userName) || userName.includes(d.driverName?.toLowerCase())))
    );

    if (fromMaster) {
      return {
        ...fromMaster,
        driverName: fromMaster.driverName || user?.name || 'Driver',
        isAttendant: false,
        designation: 'Driver'
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

  // 2. Resolve Active Assignment (Driver OR Bus Attendant)
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

  const assignedAttendant = useMemo(() => {
    if (!currentAssignment) return { name: 'Unassigned', employeeId: '', mobile: '' };

    const attendant = busAttendants.find(a =>
      (currentAssignment.attendantId && (String(a.id) === String(currentAssignment.attendantId) || a.employeeId === currentAssignment.attendantId)) ||
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
      : (attendant?.attendantName || (matchedStaff ? `${matchedStaff.firstName || ''} ${matchedStaff.lastName || ''}`.trim() : 'Unassigned'));

    let empCode = currentAssignment.attendantEmployeeId || attendant?.employeeId || matchedStaff?.empId || (matchedStaff as any)?.employeeId || (matchedStaff?.id ? `STF-${matchedStaff.id}` : '-');
    const mobile = currentAssignment.attendantMobile || attendant?.mobileNumber || matchedStaff?.phone || (matchedStaff as any)?.mobileNumber || '-';

    return {
      name,
      employeeId: empCode,
      mobile
    };
  }, [currentAssignment, busAttendants, staff]);

  const assignedDriver = useMemo(() => {
    if (!currentAssignment) return { name: 'Unassigned', employeeId: '', mobile: '' };

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
      : (driver?.driverName || (matchedStaff ? `${matchedStaff.firstName || ''} ${matchedStaff.lastName || ''}`.trim() : 'Unassigned'));

    let empCode = currentAssignment.driverEmployeeId || driver?.employeeId || matchedStaff?.empId || (matchedStaff as any)?.employeeId || (matchedStaff?.id ? `DRV-${matchedStaff.id}` : '-');
    const mobile = currentAssignment.driverMobile || driver?.mobileNumber || matchedStaff?.phone || (matchedStaff as any)?.mobileNumber || '-';

    return {
      name,
      employeeId: empCode,
      mobile
    };
  }, [currentAssignment, driverMasters, staff]);

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

  const routeStops = useMemo(() => {
    if (!targetRouteId && !targetRouteName) return [];
    return pickupPoints
      .filter(p =>
        (p.routeId && targetRouteId && String(p.routeId).trim() === targetRouteId) ||
        (p.routeName && targetRouteName && p.routeName.trim().toLowerCase() === targetRouteName)
      )
      .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
  }, [pickupPoints, targetRouteId, targetRouteName]);

  // Strictly Assigned Students for this bus / route
  const assignedStudents = useMemo(() => {
    const studentMap = new Map<string, any>();
    const hasValidRoute = (targetRouteName !== '' && targetRouteName !== 'unassigned' && targetRouteName !== 'n/a') || targetRouteId !== '';
    if (!hasValidRoute) return [];

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
        '-'
      ).trim();

      const resolvedSection = (
        student?.section ||
        (student as any)?.sectionName ||
        matchedAdm?.section ||
        (st as any)?.section ||
        (st as any)?.sectionName ||
        '-'
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
        : (routeStops.length > 0 ? routeStops[0].pickupName : '-');

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
        admissionNo: student?.admissionNo || st.admissionNo || (matchedAdm as any)?.admissionNo || matchedAdm?.registrationNo || matchedAdm?.applicationNo || '-',
        studentName: fullName,
        gender: student?.gender || matchedAdm?.gender || (student as any)?.sex || '-',
        className: resolvedClassName,
        section: resolvedSection,
        rollNo: student?.rollNo || (student as any)?.rollNumber || matchedAdm?.rollNo || (st as any)?.rollNo || '-',
        pickupPoint: pPoint,
        parentName: pName,
        parentMobile: pMobile
      });
    });

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
          (st.admissionNo && student.admissionNo && String(st.admissionNo).trim().toLowerCase() === String(student.admissionNo).trim().toLowerCase()) ||
          (st.admissionNo && student.rollNo && String(st.admissionNo).trim().toLowerCase() === String(student.rollNo).trim().toLowerCase())
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
        const fullName = (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || matchedAdm?.applicantName || student.studentName || '-').trim();
        const pName = (student.fatherName || (student as any)?.fatherFullName || student.parentName || matchedAdm?.parentName || (student as any)?.guardianName || student.motherName || matchedAdm?.motherName || '-').trim();
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
          '-'
        ).trim();

        const rawPoint = student.pickupPoint || matchedAdm?.pickupPoint;
        const pPoint = (rawPoint && rawPoint.trim() !== '' && rawPoint.trim().toUpperCase() !== 'N/A' && rawPoint !== 'Default Stop')
          ? rawPoint.trim()
          : (routeStops.length > 0 ? routeStops[0].pickupName : '-');

        const studentIdVal =
          (student as any)?.studentId ||
          student.rollNo ||
          (student as any)?.rollNumber ||
          (matchedAdm as any)?.studentId ||
          (matchedAdm as any)?.rollNo ||
          (student.admissionNo && student.admissionNo.toUpperCase().startsWith('STU') ? student.admissionNo : '') ||
          (student.id ? (String(student.id).startsWith('STU') ? String(student.id) : `STU-${student.id}`) : '') ||
          '-';

        studentMap.set(key, {
          id: student.id,
          studentId: studentIdVal,
          admissionNo: student.admissionNo || matchedAdm?.registrationNo || '-',
          studentName: fullName,
          gender: student.gender || matchedAdm?.gender || (student as any)?.sex || '-',
          className: student.className || student.grade || matchedAdm?.appliedClass || (student as any)?.class || '-',
          section: student.section || matchedAdm?.section || '-',
          rollNo: student.rollNo || (student as any)?.rollNumber || (student as any)?.roll || '-',
          pickupPoint: pPoint,
          parentName: pName,
          parentMobile: pMobile
        });
      }
    });

    return Array.from(studentMap.values());
  }, [students, studentTransports, admissions, targetRouteId, targetRouteName, targetRouteCode, routeStops]);

  const filteredStudents = useMemo(() => {
    return assignedStudents.filter(s => {
      const matchSearch =
        studentSearch.trim() === '' ||
        s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase())) ||
        s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.parentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.pickupPoint.toLowerCase().includes(studentSearch.toLowerCase());

      const matchStop = selectedStopFilter === 'All' || s.pickupPoint === selectedStopFilter;
      return matchSearch && matchStop;
    });
  }, [assignedStudents, studentSearch, selectedStopFilter]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const toggleBoarding = (studentId: string) => {
    setBoardedMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const seatingCapacity = assignedVehicle?.capacity || currentAssignment?.vehicleCapacity || 0;
  const morningTime = currentAssignment?.morningTripTime ? formatMorningTripTime(currentAssignment.morningTripTime) : '-';
  const eveningTime = currentAssignment?.eveningTripTime ? formatEveningTripTime(currentAssignment.eveningTripTime) : '-';

  const DRIVER_TABS = useMemo(() => [
    { id: 'my-bus', label: 'Vehicle & Trip Overview', icon: Bus },
    { id: 'stops', label: `Route Stops (${routeStops.length})`, icon: MapPin },
    { id: 'students', label: `Bus Passengers (${assignedStudents.length})`, icon: Users },
    { id: 'gps', label: 'Live GPS & Map', icon: Navigation }
  ], [routeStops.length, assignedStudents.length]);

  return (
    <div className="space-y-3.5 animate-in fade-in max-w-7xl mx-auto pb-8">
      {/* 1. Header Container */}
      <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-5 h-5 text-sky-600" /> My Assigned Transport Operations
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Assigned Bus: <span className="font-bold text-slate-800 dark:text-slate-200">{assignedVehicle?.vehicleNumber || 'Unassigned'}</span> • Route: <span className="font-bold text-slate-800 dark:text-slate-200">{assignedRoute?.routeName || 'Unassigned'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentAssignment && (
            <button
              onClick={() => setIsDetailsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 hover:bg-sky-100 font-bold text-[11px] flex items-center gap-1.5 border border-sky-200 dark:border-sky-800 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Full Operational Manifest
            </button>
          )}
        </div>
      </div>

      {/* 2. Separate Navigation Tabs */}
      <TransportScrollableTabs
        tabs={DRIVER_TABS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        sticky={false}
      />

      {/* 3. Tab Contents Container */}
      <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm">
        {activeTab === 'my-bus' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Bus Plate & Model</span>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{assignedVehicle?.vehicleNumber || 'Unassigned'}</div>
                <p className="text-[11px] text-slate-500 font-mono">Reg: {assignedVehicle?.registrationNumber || assignedVehicle?.vehicleNumber || 'N/A'} • {assignedVehicle?.vehicleType || 'Bus'}</p>
              </div>

              <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Assigned Route</span>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{assignedRoute?.routeName || 'Unassigned'}</div>
                <p className="text-[11px] text-emerald-600 font-bold">{routeStops.length} Stops • {assignedRoute?.totalDistanceKm ? `${assignedRoute.totalDistanceKm} km` : 'N/A'}</p>
              </div>

              <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isUserAttendant ? 'Assigned Driver' : 'Assigned Bus Attendant'}
                </span>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isUserAttendant ? assignedDriver.name : assignedAttendant.name}
                </div>
                {((isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile) && (isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile) !== '-' && (isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile) !== '') ? (
                  <a href={`tel:${isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile}`} className="text-[11px] text-sky-600 hover:underline font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {isUserAttendant ? assignedDriver.mobile : assignedAttendant.mobile}
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">Emp ID: {isUserAttendant ? (assignedDriver.employeeId || '—') : (assignedAttendant.employeeId || '—')}</span>
                )}
              </div>
            </div>

            {/* Schedule Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" /> Morning Trip Schedule
                  </span>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{morningTime}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">First pickup starts at Stop #1 and terminates at School Campus.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Evening Drop Schedule
                  </span>
                  <Badge variant="warning" size="sm">Scheduled</Badge>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{eveningTime}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Bus departs from School Campus dropping students in reverse order.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stops' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {routeStops.map((stop, idx) => {
                const count = assignedStudents.filter(s => s.pickupPoint === stop.pickupName).length;
                return (
                  <div key={stop.id || idx} className="glass-card p-3 rounded-xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {stop.morningPickupTime || stop.arrivalTime || morningTime}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{stop.pickupName}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-sky-100 dark:border-sky-900/60">
                      <span>{stop.distanceFromSchoolKm || 3.5} km</span>
                      <span className="font-bold text-emerald-600">{count} Passengers</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="w-56">
                <ValidatedSearchInput
                  value={studentSearch}
                  onChange={val => setStudentSearch(val)}
                  placeholder="Search passenger..."
                  maxLength={30}
                />
              </div>

              {routeStops.length > 0 && (
                <select
                  value={selectedStopFilter}
                  onChange={e => setSelectedStopFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-900 dark:text-white outline-none"
                >
                  <option value="All">All Stops ({assignedStudents.length} Students)</option>
                  {routeStops.map((s, idx) => (
                    <option key={idx} value={s.pickupName}>{s.pickupName}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Passenger Table View */}
            <div className="overflow-x-auto rounded-2xl border border-sky-200/80 dark:border-sky-850 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-center border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-sky-100 dark:border-sky-900/60 bg-sky-50/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 text-center w-12">#</th>
                    <th className="py-3 px-4 text-center">Student Name</th>
                    <th className="py-3 px-4 text-center">Student ID</th>
                    <th className="py-3 px-4 text-center">Class & Section</th>
                    <th className="py-3 px-4 text-center">Pickup / Drop Stop</th>
                    <th className="py-3 px-4 text-center">Guardian & Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70 dark:divide-slate-800">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        No assigned passengers found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const isBoarded = !!boardedMap[student.id];
                      const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors ${
                            isBoarded ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-bold text-slate-400 text-xs">
                            {globalIdx}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {student.studentName}
                            </div>
                            {student.gender && student.gender !== '-' && (
                              <div className="text-[10px] text-slate-400 font-medium">
                                {student.gender}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md text-[11px] inline-block">
                              {student.studentId}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                            {student.className && student.className !== '-'
                              ? `${student.className}${student.section && student.section !== '-' ? ` - ${student.section.replace(/^Section\s*/i, '')}` : ''}`
                              : (student.section && student.section !== '-' ? `Section ${student.section.replace(/^Section\s*/i, '')}` : '-')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate max-w-[180px]">{student.pickupPoint}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {student.parentName}
                              </div>
                              {student.parentMobile && student.parentMobile !== '-' ? (
                                <a
                                  href={`tel:${student.parentMobile}`}
                                  className="text-[10px] text-rose-600 dark:text-rose-400 font-mono inline-flex items-center justify-center gap-1 hover:underline mt-0.5"
                                >
                                  <Phone className="w-2.5 h-2.5 shrink-0" />
                                  <span>{student.parentMobile}</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredStudents.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                label="passengers"
              />
            )}
          </div>
        )}

        {activeTab === 'gps' && (
          <TransportGPSTrackingView
            initialVehicleId={assignedVehicle?.id || currentAssignment?.vehicleId}
            allowedVehicleId={assignedVehicle?.id || currentAssignment?.vehicleId}
            allowedVehicleNumber={assignedVehicle?.vehicleNumber || currentAssignment?.vehicleNumber}
            allowedRouteId={assignedRoute?.id || currentAssignment?.routeId}
          />
        )}
      </div>

      {/* Modal */}
      {currentAssignment && (
        <VehicleTripDetailsModal
          assignment={currentAssignment}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </div>
  );
};
