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
}

export const formatTripTime = (value?: string) => {
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

  const morningTripTime = assignment.morningTripTime ? formatTripTime(assignment.morningTripTime) : '-';
  const eveningTripTime = assignment.eveningTripTime ? formatTripTime(assignment.eveningTripTime) : '-';

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
      morningTime: mTime ? formatTripTime(mTime) : morningTripTime,
      eveningTime: eTime ? formatTripTime(eTime) : eveningTripTime
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
                           stRouteName.includes(cleanTargetRouteName) ||
                           cleanTargetRouteName.includes(stRouteName)
                         )) ||
                         (cleanTargetRouteCode !== '' && stRouteName !== '' && stRouteName === cleanTargetRouteCode);

    const matchesVehicle = (assignmentId !== '' && stVehicleAssignId !== '' && stVehicleAssignId === assignmentId) ||
                           (targetVehicleId !== '' && stVehicleAssignId !== '' && stVehicleAssignId === targetVehicleId) ||
                           (targetVehicleNum !== '' && stVehicleNum !== '' && stVehicleNum === targetVehicleNum);

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
      eveningTime
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
      Boolean(st.transportType) ||
      Boolean(st.routeId) ||
      Boolean(st.pickupPoint && configuredStops.some((cs: any) => (cs.pickupName || '').toLowerCase() === (st.pickupPoint || '').trim().toLowerCase()));

    if (!isTransportEnrolled) return;

    const stBusRoute = (st.busRoute || '').trim().toLowerCase();
    const stRouteIdStr = String(st.routeId || '').trim();
    const matchesRoute =
      (cleanTargetRouteId !== '' && stRouteIdStr !== '' && stRouteIdStr === cleanTargetRouteId) ||
      (cleanTargetRouteName !== '' && stBusRoute !== '' && (
        stBusRoute === cleanTargetRouteName ||
        stBusRoute.includes(cleanTargetRouteName) ||
        cleanTargetRouteName.includes(stBusRoute)
      )) ||
      (cleanTargetRouteCode !== '' && stBusRoute !== '' && stBusRoute === cleanTargetRouteCode) ||
      (st.pickupPoint && configuredStops.some((cs: any) => (cs.pickupName || '').trim().toLowerCase() === (st.pickupPoint || '').trim().toLowerCase()));

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
      eveningTime
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
      Boolean(adm.pickupPoint && configuredStops.some((cs: any) => (cs.pickupName || '').toLowerCase() === (adm.pickupPoint || '').trim().toLowerCase()));

    if (!isTransportEnrolled) return;

    const admBusRoute = (adm.busRoute || adm.routeName || '').trim().toLowerCase();
    const admRouteIdStr = String(adm.routeId || '').trim();
    const matchesRoute =
      (cleanTargetRouteId !== '' && admRouteIdStr !== '' && admRouteIdStr === cleanTargetRouteId) ||
      (cleanTargetRouteName !== '' && admBusRoute !== '' && (
        admBusRoute === cleanTargetRouteName ||
        admBusRoute.includes(cleanTargetRouteName) ||
        cleanTargetRouteName.includes(admBusRoute)
      )) ||
      (cleanTargetRouteCode !== '' && admBusRoute !== '' && admBusRoute === cleanTargetRouteCode) ||
      (adm.pickupPoint && configuredStops.some((cs: any) => (cs.pickupName || '').trim().toLowerCase() === (adm.pickupPoint || '').trim().toLowerCase()));

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
      eveningTime
    });
  });

  return result;
};
