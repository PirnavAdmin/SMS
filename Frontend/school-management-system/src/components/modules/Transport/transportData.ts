// ============================================================
// Transport Module — Shared static data and type definitions
// Moved here to fix Vite HMR "incompatible export" warnings.
// React component files must not export non-component values.
// ============================================================

// ---- Bus Attendant ----
export interface BusAttendantMaster {
  id: string;
  employeeId: string;
  attendantName: string;
  mobileNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  branch: string;
  status: 'Active' | 'Inactive' | 'On Leave';
}

export const initialBusAttendants: BusAttendantMaster[] = [];

export interface AssignedStudentDetail {
  id: string;
  admissionNo: string;
  studentName: string;
  gender: string;
  className: string;
  section: string;
  rollNo: string;
  pickupPoint: string;
  parentName: string;
  parentMobile: string;
  morningTime: string;
  eveningTime: string;
  routeId?: string;
  routeName?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  feePlan?: string;
  feeAmount?: number;
  effectiveFrom?: string;
  status?: string;
}

export const formatMorningTripTime = (value?: string): string => {
  if (!value || value.trim() === '' || value === '-') return '-';
  const clean = value.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    if (hour > 12) hour = hour % 12 || 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, '0')}:${minute} AM`;
  }
  return clean.replace(/PM/i, 'AM');
};

export const formatEveningTripTime = (value?: string): string => {
  if (!value || value.trim() === '' || value === '-') return '-';
  const clean = value.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    if (hour > 12) hour = hour % 12 || 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, '0')}:${minute} PM`;
  }
  return clean.replace(/AM/i, 'PM');
};

export const to24HourTime = (value?: string): string => {
  if (!value) return '';
  const clean = value.trim();
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2];
    const ampm = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(clean)) return clean.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(clean)) return clean;
  return '';
};

export const to24HourMorningTime = (value?: string): string => {
  if (!value) return '';
  const t24 = to24HourTime(value);
  if (!t24) return '';
  const [h, m] = t24.split(':').map(Number);
  const hour = h >= 12 ? h % 12 : h;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const to24HourEveningTime = (value?: string): string => {
  if (!value) return '';
  const t24 = to24HourTime(value);
  if (!t24) return '';
  const [h, m] = t24.split(':').map(Number);
  const hour = h < 12 ? h + 12 : h;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatTripTime = (value?: string, tripType?: 'morning' | 'evening') => {
  if (!value) return 'Not set';
  if (tripType === 'morning') return formatMorningTripTime(value);
  if (tripType === 'evening') return formatEveningTripTime(value);

  if (value.includes('AM') || value.includes('PM')) return value;

  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
};

export const formatAdmissionNo = (rawNo?: string, studentId?: string | number) => {
  if (!rawNo && !studentId) return '-';
  const clean = (rawNo || '').trim();
  if (!clean || clean.toUpperCase() === 'N/A' || clean === '-') {
    return studentId ? String(studentId) : '-';
  }
  return clean;
};

export interface ResolveTripStudentsOptions {
  studentTransports?: any[];
  students?: any[];
  admissions?: any[];
  routeMasters?: any[];
  pickupPoints?: any[];
  vehicleMasters?: any[];
}

export const resolveAssignedStudentsForTrip = (
  assignment: any,
  options: ResolveTripStudentsOptions
): AssignedStudentDetail[] => {
  if (!assignment) return [];

  const {
    studentTransports = [],
    students = [],
    admissions = [],
    routeMasters = [],
    pickupPoints = [],
    vehicleMasters = []
  } = options;

  const vehicle = (vehicleMasters || []).find((v: any) =>
    (assignment.vehicleId && String(v.id).trim() === String(assignment.vehicleId).trim()) ||
    (assignment.vehicleNumber && v.vehicleNumber && v.vehicleNumber.trim().toUpperCase() === assignment.vehicleNumber.trim().toUpperCase())
  ) || (vehicleMasters || []).find((v: any) => v.vehicleNumber === assignment.vehicleNumber);

  const route = (routeMasters || []).find((r: any) =>
    (assignment.routeId && String(r.id).trim() === String(assignment.routeId).trim()) ||
    (assignment.routeName && r.routeName && r.routeName.trim().toLowerCase() === assignment.routeName.trim().toLowerCase()) ||
    (assignment.routeName && r.routeCode && r.routeCode.trim().toLowerCase() === assignment.routeName.trim().toLowerCase())
  );

  const targetRouteId = route?.id ? String(route.id).trim() : (assignment.routeId ? String(assignment.routeId).trim() : '');
  const targetRouteName = (route?.routeName || assignment.routeName || '').trim().toLowerCase();
  const targetRouteCode = (route?.routeCode || '').trim().toLowerCase();
  const cleanTargetRouteName = (targetRouteName && targetRouteName !== 'unassigned route' && targetRouteName !== 'n/a') ? targetRouteName : '';
  const cleanTargetRouteCode = (targetRouteCode && targetRouteCode !== 'rt' && targetRouteCode !== 'n/a') ? targetRouteCode : '';
  const cleanTargetRouteId = (targetRouteId && targetRouteId !== '0' && targetRouteId !== '') ? targetRouteId : '';

  const targetVehicleId = String(assignment.vehicleId || vehicle?.id || '').trim();
  const targetVehicleNum = (assignment.vehicleNumber || vehicle?.vehicleNumber || '').trim().toLowerCase();
  const assignmentId = String(assignment.id || '').trim();

  const morningTripTime = assignment.morningTripTime ? formatMorningTripTime(assignment.morningTripTime) : '-';
  const eveningTripTime = assignment.eveningTripTime ? formatEveningTripTime(assignment.eveningTripTime) : '-';

  const configuredStops = (pickupPoints || [])
    .filter((point: any) =>
      (point.routeId && cleanTargetRouteId && String(point.routeId).trim() === cleanTargetRouteId) ||
      (point.routeName && cleanTargetRouteName && point.routeName.trim().toLowerCase() === cleanTargetRouteName)
    )
    .sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

  const getStopTimes = (pickupPointName?: string) => {
    if (!pickupPointName || pickupPointName === '-' || pickupPointName.toUpperCase() === 'N/A') {
      return { morningTime: morningTripTime, eveningTime: eveningTripTime };
    }
    const cleanPoint = pickupPointName.trim().toLowerCase();
    const matchedStop = configuredStops.find((s: any) =>
      (s.pickupName && s.pickupName.trim().toLowerCase() === cleanPoint) ||
      (s.pickupPointName && s.pickupPointName.trim().toLowerCase() === cleanPoint)
    ) || (pickupPoints || []).find((s: any) =>
      (s.pickupName && s.pickupName.trim().toLowerCase() === cleanPoint) ||
      (s.pickupPointName && s.pickupPointName.trim().toLowerCase() === cleanPoint)
    );

    const mTime = matchedStop?.morningPickupTime || matchedStop?.arrivalTime || matchedStop?.morningTime;
    const eTime = matchedStop?.eveningDropTime || matchedStop?.dropTime || matchedStop?.eveningTime;

    return {
      morningTime: mTime ? formatMorningTripTime(mTime) : morningTripTime,
      eveningTime: eTime ? formatEveningTripTime(eTime) : eveningTripTime
    };
  };

  const seenKeys = new Set<string>();
  const result: AssignedStudentDetail[] = [];

  // 1. Process active assignments from studentTransports
  const matchingTransports = (studentTransports || []).filter((st: any) => {
    const isStatusActive = st.status === 'Active' || st.status === true || String(st.status).toLowerCase() === 'true';
    if (!isStatusActive) return false;

    const stRouteId = String(st.routeId || '').trim();
    const stRouteName = (st.routeName || '').trim().toLowerCase();
    const stVehicleAssignId = String(st.vehicleId || st.vehicleAssignmentId || '').trim();
    const stVehicleNum = (st.vehicleNumber || '').trim().toLowerCase();

    const matchesRoute = (cleanTargetRouteId !== '' && stRouteId !== '' && stRouteId === cleanTargetRouteId) ||
                         (cleanTargetRouteName !== '' && stRouteName !== '' && (
                           stRouteName === cleanTargetRouteName ||
                           stRouteName === cleanTargetRouteCode
                         ));

    const matchesVehicle = (assignmentId !== '' && stVehicleAssignId !== '' && stVehicleAssignId === assignmentId) ||
                           (targetVehicleId !== '' && stVehicleAssignId !== '' && stVehicleAssignId === targetVehicleId) ||
                           (targetVehicleNum !== '' && stVehicleNum !== '' && stVehicleNum === targetVehicleNum);

    // If both this trip and the student record have route information, the route MUST match
    if ((stRouteId !== '' || stRouteName !== '') && (cleanTargetRouteId !== '' || cleanTargetRouteName !== '')) {
      return matchesRoute;
    }

    return matchesRoute || matchesVehicle;
  });

  matchingTransports.forEach((st: any) => {
    const matchedStudent = (students || []).find((s: any) =>
      (st.studentId && s.id && String(s.id).trim().toLowerCase() === String(st.studentId).trim().toLowerCase()) ||
      (st.admissionNo && s.admissionNo && s.admissionNo.trim().toLowerCase() === st.admissionNo.trim().toLowerCase()) ||
      (st.studentName && (`${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === st.studentName.trim().toLowerCase() || s.name?.trim().toLowerCase() === st.studentName.trim().toLowerCase()))
    );

    const matchedAdm = !matchedStudent ? (admissions || []).find((a: any) =>
      (st.admissionNo && a.registrationNo && a.registrationNo.trim().toLowerCase() === st.admissionNo.trim().toLowerCase()) ||
      (st.admissionNo && a.applicationNo && a.applicationNo.trim().toLowerCase() === st.admissionNo.trim().toLowerCase()) ||
      (st.studentId && a.id && String(a.id).trim().toLowerCase() === String(st.studentId).trim().toLowerCase()) ||
      (st.studentName && a.applicantName && a.applicantName.trim().toLowerCase() === st.studentName.trim().toLowerCase())
    ) : null;

    const resolvedName = (
      (matchedStudent?.firstName ? `${matchedStudent.firstName} ${matchedStudent.lastName || ''}`.trim() : '') ||
      matchedStudent?.studentName ||
      matchedStudent?.name ||
      st.studentName ||
      matchedAdm?.applicantName ||
      'Student'
    ).trim();

    const pName = (
      matchedStudent?.fatherName ||
      matchedStudent?.parentName ||
      matchedStudent?.motherName ||
      matchedStudent?.fatherFullName ||
      matchedAdm?.parentName ||
      matchedStudent?.guardianName ||
      '-'
    ).trim();

    const pMobile = (
      matchedStudent?.fatherPhone ||
      matchedStudent?.parentPhone ||
      matchedStudent?.fatherMobile ||
      matchedStudent?.phone ||
      matchedStudent?.mobileNumber ||
      matchedStudent?.motherMobile ||
      matchedAdm?.phone ||
      '-'
    ).trim();

    const pPoint = (st.pickupPoint && st.pickupPoint.trim() !== '' && st.pickupPoint.trim().toUpperCase() !== 'N/A')
      ? st.pickupPoint.trim()
      : (configuredStops.length > 0 ? (configuredStops[0].pickupName || configuredStops[0].label || '-') : '-');

    const rawAdm = matchedStudent?.admissionNo || st.admissionNo || matchedAdm?.registrationNo || matchedAdm?.applicationNo;
    const finalAdmissionNo = formatAdmissionNo(rawAdm, matchedStudent?.id || st.studentId || st.id);

    const k1 = finalAdmissionNo.toLowerCase();
    const k2 = String(matchedStudent?.id || st.studentId || st.id).trim().toLowerCase();
    const k3 = resolvedName.toLowerCase();

    if (seenKeys.has(k1) || seenKeys.has(k2) || (k3 && k3 !== 'student' && seenKeys.has(k3))) {
      return;
    }
    if (k1 && k1 !== '-') seenKeys.add(k1);
    if (k2) seenKeys.add(k2);
    if (k3 && k3 !== 'student') seenKeys.add(k3);

    const { morningTime, eveningTime } = getStopTimes(pPoint);

    result.push({
      id: String(st.id || matchedStudent?.id || st.studentId || `stud-${result.length + 1}`),
      admissionNo: finalAdmissionNo,
      studentName: resolvedName,
      gender: matchedStudent?.gender || matchedAdm?.gender || matchedStudent?.sex || '-',
      className: matchedStudent?.className || matchedStudent?.grade || matchedAdm?.appliedClass || matchedStudent?.class || '-',
      section: matchedStudent?.section || matchedAdm?.section || '-',
      rollNo: matchedStudent?.rollNo || matchedStudent?.rollNumber || matchedStudent?.roll || '-',
      pickupPoint: pPoint,
      parentName: pName,
      parentMobile: pMobile,
      morningTime,
      eveningTime,
      routeId: targetRouteId || st.routeId,
      routeName: route?.routeName || assignment.routeName || st.routeName || '',
      vehicleId: targetVehicleId,
      vehicleNumber: assignment.vehicleNumber || vehicle?.vehicleNumber || '',
      feePlan: st.feePlan || 'Monthly',
      feeAmount: st.feeAmount || 0,
      effectiveFrom: (st.effectiveFrom || assignment.effectiveFrom || '').split('T')[0] || new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  });

  // 2. Process students who opted for transport on this route in their profile
  (students || []).forEach((st: any) => {
    if (st.status === 'Inactive' || st.status === 'Discontinued') return;

    const isTransportEnrolled =
      st.transportRequired === true ||
      st.isTransportOpted === true ||
      st.transport === true ||
      Boolean(st.busRoute) ||
      Boolean(st.routeId);

    if (!isTransportEnrolled) return;

    const stBusRoute = (st.busRoute || '').trim().toLowerCase();
    const stRouteIdStr = String(st.routeId || '').trim();
    const matchesRoute =
      (cleanTargetRouteId !== '' && stRouteIdStr !== '' && stRouteIdStr === cleanTargetRouteId) ||
      (cleanTargetRouteName !== '' && stBusRoute !== '' && (
        stBusRoute === cleanTargetRouteName ||
        stBusRoute === cleanTargetRouteCode
      ));

    if (!matchesRoute) return;

    const studentFullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || '';
    const finalAdmNo = formatAdmissionNo(st.admissionNo || st.admissionNumber, st.id);

    const k1 = finalAdmNo.toLowerCase();
    const k2 = String(st.id).trim().toLowerCase();
    const k3 = studentFullName.toLowerCase();

    if (seenKeys.has(k1) || seenKeys.has(k2) || (k3 && seenKeys.has(k3))) {
      return;
    }
    if (k1 && k1 !== '-') seenKeys.add(k1);
    if (k2) seenKeys.add(k2);
    if (k3) seenKeys.add(k3);

    const pPoint = (st.pickupPoint && st.pickupPoint.trim() !== '' && st.pickupPoint.trim().toUpperCase() !== 'N/A')
      ? st.pickupPoint.trim()
      : (configuredStops.length > 0 ? (configuredStops[0].pickupName || '-') : '-');

    const { morningTime, eveningTime } = getStopTimes(pPoint);

    result.push({
      id: String(st.id),
      admissionNo: finalAdmNo,
      studentName: studentFullName || 'Student',
      gender: st.gender || st.sex || '-',
      className: st.className || st.grade || st.appliedClass || st.class || '-',
      section: st.section || '-',
      rollNo: st.rollNo || st.rollNumber || st.roll || '-',
      pickupPoint: pPoint,
      parentName: (st.fatherName || st.parentName || st.motherName || st.guardianName || '-').trim(),
      parentMobile: (st.fatherPhone || st.fatherMobile || st.phone || st.mobileNumber || '-').trim(),
      morningTime,
      eveningTime,
      routeId: targetRouteId || st.routeId,
      routeName: route?.routeName || assignment.routeName || st.busRoute || '',
      vehicleId: targetVehicleId,
      vehicleNumber: assignment.vehicleNumber || vehicle?.vehicleNumber || '',
      feePlan: 'Monthly',
      feeAmount: 0,
      effectiveFrom: (assignment.effectiveFrom || '').split('T')[0] || new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  });

  // 3. Process admitted students who opted for transport on this route
  (admissions || []).forEach((adm: any) => {
    if (adm.status === 'Cancelled' || adm.status === 'Rejected') return;

    const isTransportEnrolled =
      adm.transportRequired === true ||
      adm.isTransportOpted === true ||
      Boolean(adm.busRoute) ||
      Boolean(adm.routeId) ||
      Boolean(adm.routeName);

    if (!isTransportEnrolled) return;

    const admBusRoute = (adm.busRoute || adm.routeName || '').trim().toLowerCase();
    const admRouteIdStr = String(adm.routeId || '').trim();
    const matchesRoute =
      (cleanTargetRouteId !== '' && admRouteIdStr !== '' && admRouteIdStr === cleanTargetRouteId) ||
      (cleanTargetRouteName !== '' && admBusRoute !== '' && (
        admBusRoute === cleanTargetRouteName ||
        admBusRoute === cleanTargetRouteCode
      ));

    if (!matchesRoute) return;

    const applicantName = (adm.applicantName || adm.studentName || '').trim();
    const admNo = formatAdmissionNo(adm.registrationNo || adm.applicationNo, adm.id);

    const k1 = admNo.toLowerCase();
    const k2 = String(adm.id).trim().toLowerCase();
    const k3 = applicantName.toLowerCase();

    if (seenKeys.has(k1) || seenKeys.has(k2) || (k3 && seenKeys.has(k3))) {
      return;
    }
    if (k1 && k1 !== '-') seenKeys.add(k1);
    if (k2) seenKeys.add(k2);
    if (k3) seenKeys.add(k3);

    const pPoint = (adm.pickupPoint && adm.pickupPoint.trim() !== '' && adm.pickupPoint.trim().toUpperCase() !== 'N/A')
      ? adm.pickupPoint.trim()
      : (configuredStops.length > 0 ? (configuredStops[0].pickupName || '-') : '-');

    const { morningTime, eveningTime } = getStopTimes(pPoint);

    result.push({
      id: String(adm.id || `adm-${result.length + 1}`),
      admissionNo: admNo,
      studentName: applicantName || 'Student',
      gender: adm.gender || '-',
      className: adm.appliedClass || adm.className || adm.grade || '-',
      section: adm.section || '-',
      rollNo: adm.rollNo || '-',
      pickupPoint: pPoint,
      parentName: (adm.parentName || adm.fatherName || '-').trim(),
      parentMobile: (adm.phone || adm.parentPhone || adm.mobileNumber || '-').trim(),
      morningTime,
      eveningTime,
      routeId: targetRouteId || adm.routeId,
      routeName: route?.routeName || assignment.routeName || adm.busRoute || adm.routeName || '',
      vehicleId: targetVehicleId,
      vehicleNumber: assignment.vehicleNumber || vehicle?.vehicleNumber || '',
      feePlan: 'Monthly',
      feeAmount: 0,
      effectiveFrom: (assignment.effectiveFrom || '').split('T')[0] || new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  });

  return result;
};

export interface ResolveAllTransportStudentsOptions extends ResolveTripStudentsOptions {
  vehicleAssignments?: any[];
}

export const resolveAllActiveTransportStudents = (
  options: ResolveAllTransportStudentsOptions
): AssignedStudentDetail[] => {
  const {
    vehicleAssignments = [],
    studentTransports = [],
    students = [],
    admissions = [],
    routeMasters = [],
    pickupPoints = [],
    vehicleMasters = []
  } = options;

  const seenKeys = new Set<string>();
  const result: AssignedStudentDetail[] = [];

  const addStudent = (item: AssignedStudentDetail) => {
    const k1 = item.admissionNo ? item.admissionNo.trim().toLowerCase() : '';
    const k2 = String(item.id).trim().toLowerCase();
    const k3 = item.studentName ? item.studentName.trim().toLowerCase() : '';

    if (seenKeys.has(k1) || seenKeys.has(k2) || (k3 && k3 !== 'student' && seenKeys.has(k3))) {
      return;
    }
    if (k1 && k1 !== '-') seenKeys.add(k1);
    if (k2) seenKeys.add(k2);
    if (k3 && k3 !== 'student') seenKeys.add(k3);

    result.push(item);
  };

  // 1. Process all active vehicle assignments first
  const activeAssignments = (vehicleAssignments || []).filter(
    (va: any) => va.status === 'Active' || !va.status
  );
  activeAssignments.forEach((assignment: any) => {
    const tripStudents = resolveAssignedStudentsForTrip(assignment, {
      studentTransports,
      students,
      admissions,
      routeMasters,
      pickupPoints,
      vehicleMasters
    });
    tripStudents.forEach(addStudent);
  });

  // 2. Process any remaining active studentTransports not matched in active assignments
  (studentTransports || []).forEach((st: any) => {
    const isStatusActive = st.status === 'Active' || st.status === true || String(st.status).toLowerCase() === 'true';
    if (!isStatusActive) return;

    const matchedStudent = (students || []).find((s: any) =>
      (st.studentId && s.id && String(s.id).trim().toLowerCase() === String(st.studentId).trim().toLowerCase()) ||
      (st.admissionNo && s.admissionNo && s.admissionNo.trim().toLowerCase() === st.admissionNo.trim().toLowerCase()) ||
      (st.studentName && (`${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === st.studentName.trim().toLowerCase() || s.name?.trim().toLowerCase() === st.studentName.trim().toLowerCase()))
    );

    const matchedAdm = !matchedStudent ? (admissions || []).find((a: any) =>
      (st.admissionNo && a.registrationNo && a.registrationNo.trim().toLowerCase() === st.admissionNo.trim().toLowerCase()) ||
      (st.admissionNo && a.applicationNo && a.applicationNo.trim().toLowerCase() === st.admissionNo.trim().toLowerCase()) ||
      (st.studentId && a.id && String(a.id).trim().toLowerCase() === String(st.studentId).trim().toLowerCase()) ||
      (st.studentName && a.applicantName && a.applicantName.trim().toLowerCase() === st.studentName.trim().toLowerCase())
    ) : null;

    const resolvedName = (
      (matchedStudent?.firstName ? `${matchedStudent.firstName} ${matchedStudent.lastName || ''}`.trim() : '') ||
      matchedStudent?.studentName ||
      matchedStudent?.name ||
      st.studentName ||
      matchedAdm?.applicantName ||
      'Student'
    ).trim();

    const rawAdm = matchedStudent?.admissionNo || st.admissionNo || matchedAdm?.registrationNo || matchedAdm?.applicationNo;
    const finalAdmissionNo = formatAdmissionNo(rawAdm, matchedStudent?.id || st.studentId || st.id);

    const route = (routeMasters || []).find((r: any) =>
      (st.routeId && String(r.id).trim() === String(st.routeId).trim()) ||
      (st.routeName && r.routeName && r.routeName.trim().toLowerCase() === st.routeName.trim().toLowerCase())
    );

    addStudent({
      id: String(st.id || matchedStudent?.id || st.studentId || `stud-${result.length + 1}`),
      admissionNo: finalAdmissionNo,
      studentName: resolvedName,
      gender: matchedStudent?.gender || matchedAdm?.gender || matchedStudent?.sex || '-',
      className: matchedStudent?.className || matchedStudent?.grade || matchedAdm?.appliedClass || matchedStudent?.class || '-',
      section: matchedStudent?.section || matchedAdm?.section || '-',
      rollNo: matchedStudent?.rollNo || matchedStudent?.rollNumber || matchedStudent?.roll || '-',
      pickupPoint: st.pickupPoint || '-',
      parentName: (matchedStudent?.fatherName || matchedStudent?.parentName || matchedAdm?.parentName || '-').trim(),
      parentMobile: (matchedStudent?.fatherPhone || matchedStudent?.phone || matchedAdm?.phone || '-').trim(),
      morningTime: '-',
      eveningTime: '-',
      routeId: st.routeId || route?.id,
      routeName: route?.routeName || st.routeName || 'Unassigned',
      vehicleId: st.vehicleId,
      vehicleNumber: st.vehicleNumber || 'Unassigned',
      feePlan: st.feePlan || 'Monthly',
      feeAmount: st.feeAmount || 0,
      effectiveFrom: (st.effectiveFrom || '').split('T')[0] || new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  });

  // 3. Process remaining students who opted for transport in profile
  (students || []).forEach((st: any) => {
    if (st.status === 'Inactive' || st.status === 'Discontinued') return;

    const isTransportEnrolled =
      st.transportRequired === true ||
      st.isTransportOpted === true ||
      st.transport === true ||
      Boolean(st.busRoute) ||
      Boolean(st.routeId);

    if (!isTransportEnrolled) return;

    const studentFullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || '';
    const finalAdmNo = formatAdmissionNo(st.admissionNo || st.admissionNumber, st.id);

    addStudent({
      id: String(st.id),
      admissionNo: finalAdmNo,
      studentName: studentFullName || 'Student',
      gender: st.gender || st.sex || '-',
      className: st.className || st.grade || st.appliedClass || st.class || '-',
      section: st.section || '-',
      rollNo: st.rollNo || st.rollNumber || st.roll || '-',
      pickupPoint: st.pickupPoint || '-',
      parentName: (st.fatherName || st.parentName || '-').trim(),
      parentMobile: (st.fatherPhone || st.phone || '-').trim(),
      morningTime: '-',
      eveningTime: '-',
      routeId: st.routeId,
      routeName: st.busRoute || '-',
      vehicleId: '',
      vehicleNumber: 'Unassigned',
      feePlan: 'Monthly',
      feeAmount: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  });

  // 4. Process remaining admitted students who opted for transport
  (admissions || []).forEach((adm: any) => {
    if (adm.status === 'Cancelled' || adm.status === 'Rejected') return;

    const isTransportEnrolled =
      adm.transportRequired === true ||
      adm.isTransportOpted === true ||
      Boolean(adm.busRoute) ||
      Boolean(adm.routeId) ||
      Boolean(adm.routeName);

    if (!isTransportEnrolled) return;

    const applicantName = (adm.applicantName || adm.studentName || '').trim();
    const admNo = formatAdmissionNo(adm.registrationNo || adm.applicationNo, adm.id);

    addStudent({
      id: String(adm.id || `adm-${result.length + 1}`),
      admissionNo: admNo,
      studentName: applicantName || 'Student',
      gender: adm.gender || '-',
      className: adm.appliedClass || adm.className || adm.grade || '-',
      section: adm.section || '-',
      rollNo: adm.rollNo || '-',
      pickupPoint: adm.pickupPoint || '-',
      parentName: (adm.parentName || adm.fatherName || '-').trim(),
      parentMobile: (adm.phone || adm.parentPhone || '-').trim(),
      morningTime: '-',
      eveningTime: '-',
      routeId: adm.routeId,
      routeName: adm.busRoute || adm.routeName || '-',
      vehicleId: '',
      vehicleNumber: 'Unassigned',
      feePlan: 'Monthly',
      feeAmount: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  });

  return result;
};
