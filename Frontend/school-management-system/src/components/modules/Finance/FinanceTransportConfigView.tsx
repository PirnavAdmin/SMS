import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { formatDateForDisplay } from '../../../utils/dateValidation';
import {
  Route as RouteIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Bus,
  User,
  Users,
  MapPin,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  CalendarDays,
  Printer,
  Download,
  X,
  FileSpreadsheet,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { FinanceTransportConfig, PickupPoint } from '../../../types';
import { useData, matchesAcademicYear } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { exportToExcel } from '../../../utils/excelExport';

export const FinanceTransportConfigView: React.FC = () => {
  const {
    financeTransportConfigs = [],
    routeMasters = [],
    pickupPoints = [],
    vehicleAssignments = [],
    vehicleMasters = [],
    academicYearFeeSchedules = [],
    financeSettings,
    students = [],
    studentTransports = [],
    feePayments = [],
    getStudentFeeLedger,
    admissions = [],
    addFinanceTransportConfig,
    updateFinanceTransportConfig,
    deleteFinanceTransportConfig
  } = useData();

  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const activeAY = selectedAcademicYear || financeSettings?.academicYear || '2026-2027';

  // Get source-of-truth Academic Year Fee Schedule
  const currentSchedule = useMemo(() => {
    return academicYearFeeSchedules.find(s => matchesAcademicYear(s.academicYear, activeAY)) || academicYearFeeSchedules[0];
  }, [academicYearFeeSchedules, activeAY]);

  const scheduleTerms = useMemo(() => {
    return (currentSchedule?.terms && currentSchedule.terms.length > 0)
      ? [...currentSchedule.terms].sort((a, b) => a.sequence - b.sequence)
      : [
          { id: 'T1', termName: 'Term 1', sequence: 1, dueDate: '2026-07-15' },
          { id: 'T2', termName: 'Term 2', sequence: 2, dueDate: '2026-10-15' },
          { id: 'T3', termName: 'Term 3', sequence: 3, dueDate: '2027-01-15' },
          { id: 'T4', termName: 'Term 4', sequence: 4, dueDate: '2027-03-15' },
        ];
  }, [currentSchedule]);

  const oneTimeDueDate = currentSchedule?.oneTimeDueDate || scheduleTerms[0]?.dueDate || '2026-06-30';

  // Global Transport Fee Billing Policy (One-Time vs Term-Wise)
  const [globalPolicy, setGlobalPolicy] = useState<'One-Time' | 'Term-wise'>(() => {
    const saved = localStorage.getItem('transport_fee_billing_policy');
    return (saved === 'One-Time' || saved === 'Term-wise') ? saved : 'Term-wise';
  });

  const handlePolicyChange = (newPolicy: 'One-Time' | 'Term-wise') => {
    setGlobalPolicy(newPolicy);
    localStorage.setItem('transport_fee_billing_policy', newPolicy);
    window.dispatchEvent(new Event('transport_policy_updated'));
    addToast('success', 'Transport Fee Policy Updated', `Transport billing policy is now set to ${newPolicy === 'One-Time' ? 'One-Time (Full Annual)' : 'Term-Wise (Split across terms)'}.`);
  };

  const [query, setQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FinanceTransportConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<FinanceTransportConfig | null>(null);

  // Route Students Modal & Inspection State
  const [selectedRouteForStudents, setSelectedRouteForStudents] = useState<any | null>(null);
  const [routeStudentSearch, setRouteStudentSearch] = useState('');
  const [routeStudentFilter, setRouteStudentFilter] = useState<'All' | 'Pending' | 'Paid'>('All');

  // Dynamic calculation for a stop and route with normalized matching
  const calculateStopFees = (rId?: string | number, pId?: string | number, preferAC?: boolean) => {
    const normRId = String(rId || '').replace(/^rm-0*/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const route = routeMasters.find(r => {
      const rid = String(r.id || '').replace(/^rm-0*/i, '').trim().toLowerCase();
      const rname = String(r.routeName || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const rcode = String(r.routeCode || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return (normRId && (rid === normRId || rname === normRId || rcode === normRId));
    });

    const normPId = String(pId || '').trim().toLowerCase();
    const stop = pickupPoints.find(p => {
      const pid = String(p.id || '').trim().toLowerCase();
      const pname = String(p.pickupName || (p as any).pickupPointName || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return (normPId && (pid === normPId || pname === normPId));
    }) || (route ? pickupPoints.find(p => {
      const prId = String(p.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase();
      const prName = String(p.routeName || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return (prId && String(route.id).includes(prId)) || (prName && route.routeName && route.routeName.toLowerCase().includes(prName));
    }) : undefined);

    if (!route) {
      return { monthly: 0, oneTimeAnnual: 0, termWise: 0, isAC: false, distance: 0, minKm: 0, baseFare: 0, ratePerKm: 0 };
    }

    const effectiveRoute = route;

    const assignment = vehicleAssignments.find(va => {
      const vaRouteId = String(va.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase();
      const effId = String(effectiveRoute.id || '').replace(/^rm-0*/i, '').trim().toLowerCase();
      return vaRouteId && effId && vaRouteId === effId;
    });
    const vehicle = vehicleMasters.find(v => String(v.id) === String(assignment?.vehicleId));
    const isAC = preferAC !== undefined ? preferAC : (vehicle ? vehicle.isAC === true : false);

    const minKm = effectiveRoute.minDistanceKm ?? (effectiveRoute as any).minRangeKm ?? 0;
    const baseFare = isAC
      ? (effectiveRoute.acMinBaseFare ?? (effectiveRoute as any).acBaseFare ?? 0)
      : (effectiveRoute.minBaseFare ?? (effectiveRoute as any).nonAcBaseFare ?? 0);
    const ratePerKm = isAC
      ? (effectiveRoute.acRatePerKm ?? (effectiveRoute as any).acRateAddlKm ?? 0)
      : (effectiveRoute.ratePerKm ?? (effectiveRoute as any).nonAcRateAddlKm ?? (effectiveRoute as any).nonAcRatePerKm ?? 0);

    const distance = stop ? Number(stop.distanceFromSchoolKm ?? (stop as any).distanceFromStart ?? 0) : 0;
    const additionalKm = Math.max(0, distance - minKm);

    const calculatedMonthly = Math.round(baseFare + (additionalKm * ratePerKm));
    const monthly = (stop?.monthlyFee && stop.monthlyFee > 0) ? stop.monthlyFee : calculatedMonthly;
    const oneTimeAnnual = (stop?.annualFee && stop.annualFee > 0) ? stop.annualFee : (monthly * 12);
    const numTerms = scheduleTerms.length || 4;
    const termWise = Math.round(oneTimeAnnual / numTerms);

    return { monthly, oneTimeAnnual, termWise, isAC, distance, minKm, baseFare, ratePerKm };
  };

  // Helper interface for route student detail
  type RouteStudentDetail = {
    id: string;
    studentId: string;
    admissionNo: string;
    rollNo: string;
    name: string;
    className: string;
    section: string;
    pickupStop: string;
    distanceKm: number;
    feePlan: string;
    totalFee: number;
    paidAmount: number;
    dueAmount: number;
    status: 'Paid' | 'Partial' | 'Pending';
    parentContact: string;
  };

  // Dynamically resolve all students assigned to a route across studentTransports, students, and admissions
  const getRouteStudentsList = (targetRoute: any): RouteStudentDetail[] => {
    if (!targetRoute) return [];

    const normalizeRouteKey = (val: string | undefined | null) => {
      if (!val) return '';
      return String(val)
        .replace(/^rm-0*/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    };

    const targetRouteCodes = [
      normalizeRouteKey(targetRoute.id),
      normalizeRouteKey(targetRoute.routeId),
      normalizeRouteKey(targetRoute.routeCode),
      normalizeRouteKey(targetRoute.routeName),
      normalizeRouteKey(targetRoute.name)
    ].filter(Boolean);

    const isRouteMatch = (rId?: any, rName?: any) => {
      const normId = normalizeRouteKey(rId);
      const normName = normalizeRouteKey(rName);
      return Boolean(
        (normId && targetRouteCodes.includes(normId)) ||
        (normName && targetRouteCodes.includes(normName))
      );
    };

    const assignedList: RouteStudentDetail[] = [];
    const seenAdmissionNos = new Set<string>();
    const seenStudentIds = new Set<string>();

    const addRouteStudent = (params: {
      id: string;
      studentId: string;
      admissionNo: string;
      rollNo: string;
      name: string;
      className: string;
      section: string;
      pickupStop: string;
      pickupStopId?: string;
      transportType?: string;
      parentContact: string;
      rawStudentObj?: any;
    }) => {
      const normAdm = (params.admissionNo || '').trim().toLowerCase();
      const normSid = (params.studentId || params.id || '').trim().toLowerCase();

      if (normAdm && normAdm !== '-' && seenAdmissionNos.has(normAdm)) return;
      if (normSid && seenStudentIds.has(normSid)) return;

      if (normAdm && normAdm !== '-') seenAdmissionNos.add(normAdm);
      if (normSid) seenStudentIds.add(normSid);

      // Resolve pickup stop
      const stopName = params.pickupStop || '';
      const stopNameNorm = stopName.replace(/\s+/g, ' ').trim().toLowerCase();
      const stopObj = (pickupPoints || []).find((p) => {
        const pRouteMatch = isRouteMatch(p.routeId, p.routeName);
        const pIdMatch = params.pickupStopId && String(p.id) === String(params.pickupStopId);
        const pNameMatch = stopNameNorm && (
          (p.pickupName && p.pickupName.replace(/\s+/g, ' ').trim().toLowerCase() === stopNameNorm) ||
          ((p as any).pickupPointName && (p as any).pickupPointName.replace(/\s+/g, ' ').trim().toLowerCase() === stopNameNorm)
        );
        return (pRouteMatch && (pNameMatch || pIdMatch)) || pIdMatch || (pRouteMatch && !stopNameNorm);
      }) || (pickupPoints || []).find(p => isRouteMatch(p.routeId, p.routeName));

      const distanceKm = stopObj ? Number(stopObj.distanceFromSchoolKm ?? (stopObj as any).distanceFromStart ?? 0) : 0;

      // Calculate dynamic fee
      const isAC = params.transportType ? params.transportType.toLowerCase().includes('ac') && !params.transportType.toLowerCase().includes('non') : undefined;
      const stopFees = calculateStopFees(targetRoute.id, stopObj?.id || params.pickupStop, isAC);
      const calculatedFee = stopFees.oneTimeAnnual > 0 ? stopFees.oneTimeAnnual : 0;

      // Ledger check for specific transport fee
      const ledger = getStudentFeeLedger ? getStudentFeeLedger(params.studentId || params.id, params.rawStudentObj, activeAY) : null;
      const ledgerTrItem = ledger?.feeItems?.find(
        (i) => i.isApplicable && (i.headId === 'FH-TRP' || (i.category || '').toLowerCase().includes('transport') || (i.headName || '').toLowerCase().includes('transport'))
      );
      const finalFee = ledgerTrItem?.finalAmount || ledgerTrItem?.originalAmount || calculatedFee;

      // Calculate paid amount from feePayments
      const studentPayments = (feePayments || []).filter((p) => {
        const pSid = String(p.studentId || '').trim().toLowerCase();
        const pAdm = p.admissionNo ? String(p.admissionNo).trim().toLowerCase() : '';
        return (normSid && pSid === normSid) || (normAdm && (pSid === normAdm || pAdm === normAdm));
      });

      let paidAmt = 0;
      studentPayments.forEach((p) => {
        if (typeof p.transportFee === 'number' && p.transportFee > 0) {
          paidAmt += p.transportFee;
        } else if (Array.isArray(p.paymentAllocation) && p.paymentAllocation.length > 0) {
          p.paymentAllocation.forEach((a) => {
            if ((a.feeHeadName || '').toLowerCase().includes('transport') || (a.termName || '').toLowerCase().includes('transport')) {
              paidAmt += Number(a.amount || 0);
            }
          });
        } else {
          const pAny = p as any;
          if (pAny.feeHeadId === 'FH-TRP' || (pAny.category || '').toLowerCase().includes('transport') || (pAny.termName || '').toLowerCase().includes('transport') || (pAny.headName || '').toLowerCase().includes('transport')) {
            paidAmt += Number(p.amountPaid ?? pAny.amount ?? 0);
          }
        }
      });

      const dueAmt = Math.max(0, finalFee - paidAmt);
      const feeStatus: 'Paid' | 'Partial' | 'Pending' =
        dueAmt === 0 && finalFee > 0 ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Pending';

      assignedList.push({
        id: params.id,
        studentId: params.studentId || params.id,
        admissionNo: params.admissionNo || '-',
        rollNo: params.rollNo || '-',
        name: params.name,
        className: params.className || '-',
        section: params.section || 'A',
        pickupStop: stopName || stopObj?.pickupName || (stopObj as any)?.pickupPointName || 'Main Stop',
        distanceKm,
        feePlan: globalPolicy === 'One-Time' ? 'One-Time' : 'Term-Wise',
        totalFee: finalFee,
        paidAmount: paidAmt,
        dueAmount: dueAmt,
        status: feeStatus,
        parentContact: params.parentContact || '-',
      });
    };

    // Source 1: Check studentTransports (active assignments)
    (studentTransports || []).forEach((t: any) => {
      const isStatusActive = t.status === 'Active' || t.status === true || String(t.status).toLowerCase() === 'true';
      if (!isStatusActive) return;
      if (!isRouteMatch(t.routeId, t.routeName)) return;

      const matchedStudent = (students || []).find((s: any) =>
        (t.studentId && s.id && String(s.id).trim().toLowerCase() === String(t.studentId).trim().toLowerCase()) ||
        (t.admissionNo && s.admissionNo && s.admissionNo.trim().toLowerCase() === t.admissionNo.trim().toLowerCase())
      );

      const matchedAdm = !matchedStudent ? (admissions || []).find((a: any) =>
        (t.admissionNo && a.admissionNo && a.admissionNo.trim().toLowerCase() === t.admissionNo.trim().toLowerCase()) ||
        (t.admissionNo && a.registrationNo && a.registrationNo.trim().toLowerCase() === t.admissionNo.trim().toLowerCase()) ||
        (t.studentId && a.id && String(a.id).trim().toLowerCase() === String(t.studentId).trim().toLowerCase())
      ) : null;

      const sName = (
        (matchedStudent?.firstName ? `${matchedStudent.firstName} ${matchedStudent.lastName || ''}`.trim() : '') ||
        (matchedStudent as any)?.studentName ||
        (matchedStudent as any)?.name ||
        t.studentName ||
        matchedAdm?.applicantName ||
        (matchedAdm as any)?.studentName ||
        'Student'
      ).trim();

      const admNo = matchedStudent?.admissionNo || t.admissionNo || matchedAdm?.admissionNo || matchedAdm?.registrationNo || '-';
      const contact = matchedStudent?.phone || (matchedStudent as any)?.parentPhone || (matchedStudent as any)?.fatherPhone || matchedAdm?.phone || (matchedAdm as any)?.parentPhone || '-';

      addRouteStudent({
        id: String(t.id || matchedStudent?.id || t.studentId),
        studentId: String(matchedStudent?.id || t.studentId || t.id),
        admissionNo: admNo,
        rollNo: matchedStudent?.rollNo || (matchedStudent as any)?.rollNumber || '-',
        name: sName,
        className: matchedStudent?.className || (matchedStudent as any)?.class || matchedAdm?.appliedClass || '-',
        section: matchedStudent?.section || (matchedAdm as any)?.section || 'A',
        pickupStop: t.pickupPoint || (matchedStudent as any)?.pickupPoint || (matchedAdm as any)?.pickupPoint || '',
        pickupStopId: t.pickupPointId,
        transportType: t.transportType || (matchedStudent as any)?.transportType || (matchedAdm as any)?.transportType,
        parentContact: contact,
        rawStudentObj: matchedStudent || matchedAdm || t,
      });
    });

    // Source 2: Check students (profiles with transport opted or linked admission)
    (students || []).forEach((st: any) => {
      if (st.status === 'Inactive' || st.status === 'Discontinued') return;

      const stRouteMatch = isRouteMatch(st.routeId, (st as any).busRoute || (st as any).routeName || (st as any).route);

      const matchingAdmission = (admissions || []).find((a: any) =>
        (st.admissionNo && a.admissionNo && a.admissionNo.trim().toLowerCase() === st.admissionNo.trim().toLowerCase()) ||
        (st.admissionNo && a.registrationNo && a.registrationNo.trim().toLowerCase() === st.admissionNo.trim().toLowerCase()) ||
        (st.id && a.id && String(a.id).trim().toLowerCase() === String(st.id).trim().toLowerCase()) ||
        (a.applicantName && `${st.firstName || ''} ${st.lastName || ''}`.trim().toLowerCase() === a.applicantName.trim().toLowerCase())
      );

      const admRouteMatch = matchingAdmission && isRouteMatch((matchingAdmission as any).routeId, matchingAdmission.busRoute || (matchingAdmission as any).routeName);

      const isTransportEnrolled =
        st.transportRequired === true ||
        (st as any).isTransportOpted === true ||
        Boolean((st as any).busRoute) ||
        Boolean(st.routeId) ||
        (matchingAdmission && (matchingAdmission.transportRequired === true || Boolean(matchingAdmission.busRoute)));

      if (!isTransportEnrolled) return;
      if (!stRouteMatch && !admRouteMatch) return;

      const studentFullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || (st as any).name || (st as any).studentName || 'Student';
      const admNo = st.admissionNo || (st as any).admissionNumber || matchingAdmission?.admissionNo || matchingAdmission?.registrationNo || '-';
      const pickupStop = (st as any).pickupPoint || matchingAdmission?.pickupPoint || '';
      const contact = st.phone || (st as any).parentPhone || (st as any).fatherPhone || matchingAdmission?.phone || '-';

      addRouteStudent({
        id: String(st.id),
        studentId: String(st.id),
        admissionNo: admNo,
        rollNo: st.rollNo || (st as any).rollNumber || '-',
        name: studentFullName,
        className: st.className || (st as any).class || matchingAdmission?.appliedClass || '-',
        section: st.section || 'A',
        pickupStop,
        transportType: (st as any).transportType || matchingAdmission?.transportType,
        parentContact: contact,
        rawStudentObj: st,
      });
    });

    // Source 3: Check admissions (enrolled / admitted students who opted for transport)
    (admissions || []).forEach((adm: any) => {
      if (adm.status === 'Cancelled' || adm.status === 'Rejected') return;

      const isTransportEnrolled =
        adm.transportRequired === true ||
        adm.isTransportOpted === true ||
        Boolean(adm.busRoute) ||
        Boolean(adm.routeId) ||
        Boolean((adm as any).routeName);

      if (!isTransportEnrolled) return;
      if (!isRouteMatch((adm as any).routeId, adm.busRoute || (adm as any).routeName)) return;

      const applicantName = (adm.applicantName || (adm as any).studentName || `${(adm as any).firstName || ''} ${(adm as any).lastName || ''}`.trim() || 'Student').trim();
      const admNo = adm.admissionNo || (adm as any).admissionNumber || adm.registrationNo || adm.applicationNo || '-';
      const contact = adm.phone || (adm as any).fatherMobile || (adm as any).fatherMobileNo || (adm as any).parentPhone || '-';

      addRouteStudent({
        id: String(adm.id || (adm as any).applicationId),
        studentId: String(adm.id || (adm as any).applicationId),
        admissionNo: admNo,
        rollNo: (adm as any).rollNo || '-',
        name: applicantName,
        className: adm.appliedClass || (adm as any).className || '-',
        section: (adm as any).section || 'A',
        pickupStop: adm.pickupPoint || '',
        transportType: adm.transportType,
        parentContact: contact,
        rawStudentObj: adm,
      });
    });

    return assignedList;
  };

  // Print Roster of All Students on Route
  const handlePrintAllRouteStudents = (route: any, studentsList: RouteStudentDetail[]) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const totalFeeSum = studentsList.reduce((sum, s) => sum + s.totalFee, 0);
    const totalPaidSum = studentsList.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalDueSum = studentsList.reduce((sum, s) => sum + s.dueAmount, 0);

    const targetRouteCodes = [
      String(route.id || '').replace(/^rm-0*/i, '').trim().toLowerCase(),
      String(route.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase(),
      String(route.routeCode || '').replace(/\s+/g, ' ').trim().toLowerCase(),
      String(route.routeName || route.name || '').replace(/\s+/g, ' ').trim().toLowerCase(),
    ].filter(Boolean);

    const vehicleRel = vehicleAssignments.find(va => {
      if (va.status !== 'Active') return false;
      const vaRouteId = String(va.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase();
      const vaRouteName = String(va.routeName || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return (vaRouteId && targetRouteCodes.includes(vaRouteId)) || (vaRouteName && targetRouteCodes.includes(vaRouteName));
    });
    const vehicleObj = vehicleMasters.find(v => String(v.id) === String(vehicleRel?.vehicleId));
    const driverName = vehicleRel?.driverName || (route.assignedDriverName && route.assignedDriverName !== 'Unassigned' ? route.assignedDriverName : '') || (route.assignedDriver && route.assignedDriver !== 'Unassigned' ? route.assignedDriver : '') || 'Unassigned';
    const vehicleNumber = vehicleObj?.vehicleNumber || vehicleRel?.vehicleNumber || (route.assignedVehicleNumber && route.assignedVehicleNumber !== 'Unassigned' ? route.assignedVehicleNumber : '') || (route.assignedBus && route.assignedBus !== 'Unassigned' ? route.assignedBus : '') || 'Unassigned';

    const rowsHtml = studentsList.map((st, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; font-weight: bold;">${st.admissionNo}</td>
        <td style="padding: 8px; font-weight: bold;">${st.name}</td>
        <td style="padding: 8px; text-align: center;">${st.className} - ${st.section}</td>
        <td style="padding: 8px;">${st.pickupStop} (${st.distanceKm} KM)</td>
        <td style="padding: 8px; text-align: right; font-weight: bold;">₹${st.totalFee.toLocaleString('en-IN')}</td>
        <td style="padding: 8px; text-align: right; color: #16a34a;">₹${st.paidAmount.toLocaleString('en-IN')}</td>
        <td style="padding: 8px; text-align: right; color: ${st.dueAmount > 0 ? '#dc2626' : '#16a34a'}; font-weight: bold;">₹${st.dueAmount.toLocaleString('en-IN')}</td>
        <td style="padding: 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background-color: ${st.status === 'Paid' ? '#dcfce7; color: #166534;' : st.status === 'Partial' ? '#fef3c7; color: #92400e;' : '#fee2e2; color: #991b1b;'}">
            ${st.status}
          </span>
        </td>
        <td style="padding: 8px;">${st.parentContact}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Route Transport Roster - ${route.routeName || 'Route'}</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 15px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 15px; }
            .title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 11px; }
            .meta-item strong { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #0284c7; color: #ffffff; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 700; }
            .summary-box { display: flex; justify-content: flex-end; gap: 20px; margin-top: 15px; padding-top: 10px; border-top: 2px solid #e2e8f0; font-size: 12px; }
            .print-btn { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 15px; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="display: flex; justify-content: flex-end;">
            <button class="print-btn" onclick="window.print()">🖨️ Print Roster</button>
          </div>
          <div class="header">
            <div>
              <h1 class="title">PIRNAV SCHOOL</h1>
              <div class="subtitle">Transport Department • Student Route Roster (${activeAY})</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div>Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div>Total Students: <strong>${studentsList.length}</strong></div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <strong>Transit Route</strong>
              <span>${route.routeName || 'Route'} (${route.routeCode || '-'})</span>
            </div>
            <div class="meta-item">
              <strong>Assigned Bus</strong>
              <span>${vehicleNumber} ${vehicleObj?.isAC ? '(AC)' : '(Non-AC)'}</span>
            </div>
            <div class="meta-item">
              <strong>Assigned Driver</strong>
              <span>${driverName}</span>
            </div>
            <div class="meta-item">
              <strong>Fee Policy</strong>
              <span>${globalPolicy === 'One-Time' ? 'One-Time (Annual)' : 'Term-Wise'}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
                <th>Adm No</th>
                <th>Student Name</th>
                <th style="text-align: center;">Class</th>
                <th>Pickup Stop</th>
                <th style="text-align: right;">Fee (₹)</th>
                <th style="text-align: right;">Paid (₹)</th>
                <th style="text-align: right;">Due (₹)</th>
                <th style="text-align: center;">Status</th>
                <th>Parent Phone</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="10" style="text-align:center; padding: 20px;">No students assigned to this route.</td></tr>'}
            </tbody>
          </table>

          <div class="summary-box">
            <div>Total Expected: <strong>₹${totalFeeSum.toLocaleString('en-IN')}</strong></div>
            <div>Total Collected: <strong style="color: #16a34a;">₹${totalPaidSum.toLocaleString('en-IN')}</strong></div>
            <div>Total Pending Dues: <strong style="color: #dc2626;">₹${totalDueSum.toLocaleString('en-IN')}</strong></div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  // Print Dues / Defaulters List for Route
  const handlePrintPendingRouteStudents = (route: any, studentsList: RouteStudentDetail[]) => {
    const pendingStudents = studentsList.filter(s => s.dueAmount > 0);
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const totalFeeSum = pendingStudents.reduce((sum, s) => sum + s.totalFee, 0);
    const totalPaidSum = pendingStudents.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalDueSum = pendingStudents.reduce((sum, s) => sum + s.dueAmount, 0);

    const targetRouteCodes = [
      String(route.id || '').replace(/^rm-0*/i, '').trim().toLowerCase(),
      String(route.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase(),
      String(route.routeCode || '').replace(/\s+/g, ' ').trim().toLowerCase(),
      String(route.routeName || route.name || '').replace(/\s+/g, ' ').trim().toLowerCase(),
    ].filter(Boolean);

    const vehicleRel = vehicleAssignments.find(va => {
      if (va.status !== 'Active') return false;
      const vaRouteId = String(va.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase();
      const vaRouteName = String(va.routeName || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return (vaRouteId && targetRouteCodes.includes(vaRouteId)) || (vaRouteName && targetRouteCodes.includes(vaRouteName));
    });
    const vehicleObj = vehicleMasters.find(v => String(v.id) === String(vehicleRel?.vehicleId));
    const driverName = vehicleRel?.driverName || (route.assignedDriverName && route.assignedDriverName !== 'Unassigned' ? route.assignedDriverName : '') || (route.assignedDriver && route.assignedDriver !== 'Unassigned' ? route.assignedDriver : '') || 'Unassigned';
    const vehicleNumber = vehicleObj?.vehicleNumber || vehicleRel?.vehicleNumber || (route.assignedVehicleNumber && route.assignedVehicleNumber !== 'Unassigned' ? route.assignedVehicleNumber : '') || (route.assignedBus && route.assignedBus !== 'Unassigned' ? route.assignedBus : '') || 'Unassigned';

    const rowsHtml = pendingStudents.map((st, idx) => `
      <tr style="border-bottom: 1px solid #fee2e2; font-size: 11px;">
        <td style="padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; font-weight: bold;">${st.admissionNo}</td>
        <td style="padding: 8px; font-weight: bold;">${st.name}</td>
        <td style="padding: 8px; text-align: center;">${st.className} - ${st.section}</td>
        <td style="padding: 8px;">${st.pickupStop}</td>
        <td style="padding: 8px; text-align: right;">₹${st.totalFee.toLocaleString('en-IN')}</td>
        <td style="padding: 8px; text-align: right; color: #16a34a;">₹${st.paidAmount.toLocaleString('en-IN')}</td>
        <td style="padding: 8px; text-align: right; color: #dc2626; font-weight: bold; font-size: 12px;">₹${st.dueAmount.toLocaleString('en-IN')}</td>
        <td style="padding: 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background-color: #fee2e2; color: #991b1b;">
            ${st.status === 'Partial' ? 'PARTIAL DUE' : 'OVERDUE'}
          </span>
        </td>
        <td style="padding: 8px; font-weight: bold;">${st.parentContact}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pending Transport Fee Notice - ${route.routeName || 'Route'}</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 15px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e11d48; padding-bottom: 12px; margin-bottom: 15px; }
            .title { font-size: 20px; font-weight: 900; color: #9f1239; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #fff1f2; border: 1px solid #fecdd3; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 11px; }
            .meta-item strong { display: block; color: #9f1239; font-size: 10px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #e11d48; color: #ffffff; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 700; }
            .summary-box { display: flex; justify-content: flex-end; gap: 20px; margin-top: 15px; padding-top: 10px; border-top: 2px solid #e2e8f0; font-size: 12px; }
            .print-btn { background: #e11d48; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 15px; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="display: flex; justify-content: flex-end;">
            <button class="print-btn" onclick="window.print()">🖨️ Print Pending Dues Report</button>
          </div>
          <div class="header">
            <div>
              <h1 class="title">PIRNAV SCHOOL • TRANSPORT DUES NOTICE</h1>
              <div class="subtitle">Route Fee Defaulters & Pending Dues Statement (${activeAY})</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div>Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div>Defaulters Count: <strong style="color: #e11d48;">${pendingStudents.length}</strong></div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <strong>Transit Route</strong>
              <span>${route.routeName || 'Route'} (${route.routeCode || '-'})</span>
            </div>
            <div class="meta-item">
              <strong>Assigned Bus</strong>
              <span>${vehicleNumber}</span>
            </div>
            <div class="meta-item">
              <strong>Driver / Staff</strong>
              <span>${driverName}</span>
            </div>
            <div class="meta-item">
              <strong>Pending Fee Total</strong>
              <span style="font-weight: bold; color: #e11d48;">₹${totalDueSum.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
                <th>Adm No</th>
                <th>Student Name</th>
                <th style="text-align: center;">Class</th>
                <th>Pickup Stop</th>
                <th style="text-align: right;">Total Fee (₹)</th>
                <th style="text-align: right;">Paid (₹)</th>
                <th style="text-align: right;">Pending Due (₹)</th>
                <th style="text-align: center;">Status</th>
                <th>Parent Phone</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="10" style="text-align:center; padding: 20px; color: #16a34a; font-weight: bold;">🎉 All students on this route have cleared their transport fees!</td></tr>'}
            </tbody>
          </table>

          <div class="summary-box">
            <div>Total Assessed: <strong>₹${totalFeeSum.toLocaleString('en-IN')}</strong></div>
            <div>Total Collected: <strong style="color: #16a34a;">₹${totalPaidSum.toLocaleString('en-IN')}</strong></div>
            <div>Total Outstanding Dues: <strong style="color: #e11d48; font-size: 14px;">₹${totalDueSum.toLocaleString('en-IN')}</strong></div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  // Export Route Students to Excel
  const handleExportRouteStudents = (route: any, studentsList: RouteStudentDetail[]) => {
    if (!studentsList || studentsList.length === 0) {
      addToast('warning', 'No Records', 'No students found on this route to export.');
      return;
    }
    const exportData = studentsList.map((st, idx) => ({
      'S.No': idx + 1,
      'Admission No': st.admissionNo,
      'Student Name': st.name,
      'Class': st.className,
      'Section': st.section,
      'Pickup Stop': st.pickupStop,
      'Distance (KM)': st.distanceKm,
      'Transport Fee (₹)': st.totalFee,
      'Paid Amount (₹)': st.paidAmount,
      'Pending Due (₹)': st.dueAmount,
      'Status': st.status,
      'Parent Contact': st.parentContact,
    }));
    exportToExcel(exportData, `Route_${route.routeCode || 'Roster'}_Students_${activeAY}`);
    addToast('success', 'Export Successful', `Exported ${studentsList.length} students to Excel.`);
  };

  // Form State for modal overrides
  const [form, setForm] = useState<Partial<FinanceTransportConfig>>({
    routeId: '',
    routeName: '',
    vehicleId: '',
    vehicleNumber: '',
    driverId: '',
    driverName: '',
    pickupPointId: '',
    pickupName: '',
    feePlan: 'Quarterly',
    feeAmount: 0,
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const handleRouteSelect = (routeId: string) => {
    const route = routeMasters.find(r => String(r.id) === String(routeId));
    const assignment = vehicleAssignments.find(va => String(va.routeId) === String(routeId));
    const stops = pickupPoints.filter(p => String(p.routeId) === String(routeId));
    const firstStop = stops[0];

    const feeMetrics = firstStop ? calculateStopFees(routeId, firstStop.id) : null;
    const initialAmt = feeMetrics
      ? (globalPolicy === 'One-Time' ? feeMetrics.oneTimeAnnual : feeMetrics.termWise)
      : 0;

    setForm(prev => ({
      ...prev,
      routeId,
      routeName: route?.routeName || '',
      vehicleId: assignment?.vehicleId || '',
      vehicleNumber: assignment?.vehicleNumber || 'Unassigned',
      driverId: assignment?.driverId || '',
      driverName: assignment?.driverName || 'Unassigned',
      pickupPointId: firstStop?.id || '',
      pickupName: firstStop?.pickupName || '',
      feePlan: globalPolicy === 'One-Time' ? 'Annual' : 'Quarterly',
      feeAmount: initialAmt
    }));
  };

  const handlePickupSelect = (pickupPointId: string) => {
    const pk = pickupPoints.find(p => String(p.id) === String(pickupPointId));
    const feeMetrics = calculateStopFees(form.routeId, pickupPointId);
    const initialAmt = globalPolicy === 'One-Time' ? feeMetrics.oneTimeAnnual : feeMetrics.termWise;

    setForm(prev => ({
      ...prev,
      pickupPointId,
      pickupName: pk?.pickupName || '',
      feeAmount: initialAmt
    }));
  };

  const handleOpenAdd = () => {
    setEditingConfig(null);
    if (routeMasters.length > 0) {
      handleRouteSelect(routeMasters[0].id);
    } else {
      setForm({
        routeId: '',
        routeName: '',
        vehicleId: '',
        vehicleNumber: '',
        driverId: '',
        driverName: '',
        pickupPointId: '',
        pickupName: '',
        feePlan: globalPolicy === 'One-Time' ? 'Annual' : 'Quarterly',
        feeAmount: 0,
        effectiveFrom: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: FinanceTransportConfig) => {
    setEditingConfig(c);
    setForm(c);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.routeId || !form.pickupPointId) {
      addToast('warning', 'Missing Selection', 'Please select Route and Pickup Point.');
      return;
    }

    const payload = form as Omit<FinanceTransportConfig, 'id'>;

    if (editingConfig) {
      updateFinanceTransportConfig(editingConfig.id, payload);
      addToast('success', 'Transport Fee Config Updated', `Updated pricing for ${form.pickupName}`);
    } else {
      addFinanceTransportConfig(payload);
      addToast('success', 'Transport Fee Config Saved', `Saved configuration for ${form.pickupName}`);
    }
    setIsModalOpen(false);
  };

  // Compile full dynamic pickup matrix strictly driven by valid routeMasters
  const pickupMatrix = useMemo(() => {
    const rows: Array<{
      pickup: PickupPoint;
      route: any;
      assignment: any;
      vehicle: any;
      isAC: boolean;
      fees: ReturnType<typeof calculateStopFees>;
      customConfig: any;
    }> = [];

    routeMasters.forEach(route => {
      // Find stops belonging to this route
      const stopsForRoute = pickupPoints.filter(p => {
        const matchesRouteId = p.routeId !== undefined && p.routeId !== null && String(p.routeId) === String(route.id);
        const matchesRouteName = p.routeName && route.routeName &&
          p.routeName.trim().toLowerCase() === route.routeName.trim().toLowerCase();
        return matchesRouteId || matchesRouteName;
      });

      const assignment = vehicleAssignments.find(va => String(va.routeId) === String(route.id));
      const vehicle = vehicleMasters.find(v => String(v.id) === String(assignment?.vehicleId));
      const isAC = vehicle ? vehicle.isAC === true : false;

      if (stopsForRoute.length > 0) {
        stopsForRoute.forEach(p => {
          const matchesQuery =
            (p.pickupName || '').toLowerCase().includes(query.toLowerCase()) ||
            (route.routeName || '').toLowerCase().includes(query.toLowerCase()) ||
            (route.routeCode || '').toLowerCase().includes(query.toLowerCase());
          const matchesRoute = filterRoute === 'All' || String(route.id) === String(filterRoute);

          if (matchesQuery && matchesRoute) {
            const fees = calculateStopFees(route.id, p.id);
            const customConfig = financeTransportConfigs.find(
              c => String(c.routeId) === String(route.id) &&
                   String(c.pickupPointId) === String(p.id) &&
                   c.status === 'Active'
            );
            rows.push({
              pickup: p,
              route,
              assignment,
              vehicle,
              isAC,
              fees,
              customConfig
            });
          }
        });
      } else {
        // Route has no pickup points defined yet - display base route row
        const matchesQuery =
          (route.routeName || '').toLowerCase().includes(query.toLowerCase()) ||
          (route.routeCode || '').toLowerCase().includes(query.toLowerCase());
        const matchesRoute = filterRoute === 'All' || String(route.id) === String(filterRoute);

        if (matchesQuery && matchesRoute) {
          const fees = calculateStopFees(route.id);
          const customConfig = financeTransportConfigs.find(
            c => String(c.routeId) === String(route.id) &&
                 (!c.pickupPointId || c.pickupPointId === '0') &&
                 c.status === 'Active'
          );
          const syntheticPickup: PickupPoint = {
            id: `route-base-${route.id}`,
            routeId: route.id,
            routeName: route.routeName,
            pickupName: route.routeEnd ? `${route.routeStart || 'Start'} to ${route.routeEnd}` : 'Direct Route',
            sequenceNumber: 1,
            arrivalTime: '',
            distanceFromSchoolKm: route.totalDistanceKm || (route as any).distanceKm || 0,
            monthlyFee: fees.monthly,
            status: 'Active'
          };
          rows.push({
            pickup: syntheticPickup,
            route,
            assignment,
            vehicle,
            isAC,
            fees,
            customConfig
          });
        }
      }
    });

    return rows;
  }, [pickupPoints, routeMasters, vehicleAssignments, vehicleMasters, financeTransportConfigs, query, filterRoute, scheduleTerms]);

  const routeStops = useMemo(() => {
    return pickupPoints.filter(p => String(p.routeId) === String(form.routeId));
  }, [pickupPoints, form.routeId]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RouteIcon className="w-6 h-6 text-sky-500" /> Transport Fee & Kilometer Rate Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure kilometer-based transport fees, select One-Time vs Term-Wise billing policy, and synchronize term due dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Custom Rate Override
          </button>
          <ExportButton data={pickupMatrix.map(m => ({
            Route: m.route?.routeName || m.pickup.routeName,
            PickupPoint: m.pickup.pickupName,
            DistanceKm: m.fees.distance,
            VehicleType: m.isAC ? 'AC' : 'Non-AC',
            MonthlyFee: m.fees.monthly,
            OneTimeAnnualFee: m.fees.oneTimeAnnual,
            TermWiseFee: m.fees.termWise
          }))} filename="finance_transport_kilometer_matrix" />
        </div>
      </div>

      {/* Official Academic Schedule Term Due Dates Banner */}
      <div className="glass-card p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-sky-900 dark:text-sky-200">
                Official Fee Schedule Term Due Dates ({activeAY})
              </h3>
              <p className="text-[11px] text-sky-700 dark:text-sky-300">
                These due dates apply directly to transport fee obligations and installments across both Transport and Finance modules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Billing Policy:</span>
            <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-0.5 text-xs font-bold">
              <button
                onClick={() => handlePolicyChange('One-Time')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  globalPolicy === 'One-Time'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                One-Time Fee
              </button>
              <button
                onClick={() => handlePolicyChange('Term-wise')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  globalPolicy === 'Term-wise'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Term-Wise Fee
              </button>
            </div>
          </div>
        </div>

        {/* Due Dates Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-sky-100 dark:border-sky-900/40">
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">One-Time / Annual</span>
            <span className="text-xs font-mono font-black text-sky-600 dark:text-sky-400">
              {formatDateForDisplay(oneTimeDueDate)}
            </span>
          </div>

          {scheduleTerms.map((term, idx) => (
            <div key={term.id || idx} className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{term.termName || `Term ${idx + 1}`}</span>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                {formatDateForDisplay(term.dueDate)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search stop name, route, bus..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={filterRoute}
          onChange={e => setFilterRoute(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="All">All Transit Routes ({routeMasters.length})</option>
          {routeMasters.map(r => (
            <option key={r.id} value={r.id}>
              {r.routeName} ({r.routeCode || 'No Code'})
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Rates Matrix Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Route & Code</th>
                <th className="py-3.5 px-4">Pickup Stop</th>
                <th className="py-3.5 px-4 text-center">Distance</th>
                <th className="py-3.5 px-4">Kilometer Slab Rates</th>
                <th className="py-3.5 px-4 text-right">Monthly Rate</th>
                <th className="py-3.5 px-4 text-right">One-Time (Annual)</th>
                <th className="py-3.5 px-4 text-right">Term-Wise ({scheduleTerms.length} Terms)</th>
                <th className="py-3.5 px-4 text-center">Active Policy</th>
                <th className="py-3.5 px-4 text-center">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {pickupMatrix.length > 0 ? (
                pickupMatrix.map(({ pickup, route, assignment, isAC, fees, customConfig }) => {
                  const effectiveAnnual = customConfig?.feePlan === 'Annual' && customConfig?.feeAmount ? customConfig.feeAmount : fees.oneTimeAnnual;
                  const effectiveTerm = (customConfig?.feePlan === 'Quarterly' || (customConfig?.feePlan as any) === 'Term-wise') && customConfig?.feeAmount
                    ? customConfig.feeAmount
                    : fees.termWise;

                  return (
                    <tr key={pickup.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td
                        className="py-3 px-4 font-extrabold text-slate-900 dark:text-white cursor-pointer group/rt"
                        onClick={() => setSelectedRouteForStudents(route)}
                        title="Click to view students on this route"
                      >
                        <div className="flex items-center gap-1.5 group-hover/rt:text-sky-600 transition-colors">
                          <RouteIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="underline decoration-dotted underline-offset-2">{route.routeName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {route.routeCode || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{pickup.pickupName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Seq #{pickup.sequenceNumber ?? 1} {pickup.arrivalTime ? `• Arr: ${pickup.arrivalTime}` : ''}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                          {fees.distance} KM
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${isAC ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {isAC ? 'AC Bus' : 'Non-AC Bus'}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span>Base: ₹{fees.baseFare} (0-{fees.minKm}km) + ₹{fees.ratePerKm}/km</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-slate-700 dark:text-slate-300">
                        {formatCurrency(fees.monthly)}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-sky-600 dark:text-sky-400 text-xs">
                        {formatCurrency(effectiveAnnual)}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(effectiveTerm)}
                        <span className="text-[10px] text-slate-400 block font-normal">/ term</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={globalPolicy === 'One-Time' ? 'info' : 'success'}>
                          {globalPolicy === 'One-Time' ? 'One-Time' : 'Term-Wise'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const routeStudents = getRouteStudentsList(route);
                          const count = routeStudents.length;
                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedRouteForStudents(route)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white dark:bg-sky-950 dark:text-sky-300 dark:hover:bg-sky-600 cursor-pointer shadow-xs border border-sky-200 dark:border-sky-800"
                              title={`View ${count} students assigned to ${route.routeName}`}
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>{count}</span>
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No pickup points found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Students Roster & Inspection Modal */}
      {selectedRouteForStudents && (() => {
        const targetRoute = selectedRouteForStudents;
        const normTargetId = String(targetRoute.id || '').replace(/^rm-0*/i, '').trim().toLowerCase();
        const normTargetName = String(targetRoute.routeName || targetRoute.name || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const normTargetCode = String(targetRoute.routeCode || '').replace(/\s+/g, ' ').trim().toLowerCase();

        const fullRouteObj = routeMasters.find(r => {
          const rId = String(r.id || '').replace(/^rm-0*/i, '').trim().toLowerCase();
          const rName = String(r.routeName || (r as any).name || '').replace(/\s+/g, ' ').trim().toLowerCase();
          const rCode = String(r.routeCode || '').replace(/\s+/g, ' ').trim().toLowerCase();
          return (normTargetId && rId === normTargetId) ||
                 (normTargetName && rName === normTargetName) ||
                 (normTargetCode && rCode === normTargetCode) ||
                 (normTargetName && rCode === normTargetName) ||
                 (normTargetCode && rName === normTargetCode);
        }) || targetRoute;

        const allStudentsInRoute = getRouteStudentsList(fullRouteObj);

        // Vehicle & Driver Info with robust normalized matching
        const targetRouteCodes = [
          String(fullRouteObj.id || '').replace(/^rm-0*/i, '').trim().toLowerCase(),
          String(fullRouteObj.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase(),
          String(fullRouteObj.routeCode || '').replace(/\s+/g, ' ').trim().toLowerCase(),
          String(fullRouteObj.routeName || fullRouteObj.name || '').replace(/\s+/g, ' ').trim().toLowerCase(),
        ].filter(Boolean);

        const assignment = vehicleAssignments.find(va => {
          if (va.status !== 'Active') return false;
          const vaRouteId = String(va.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase();
          const vaRouteName = String(va.routeName || '').replace(/\s+/g, ' ').trim().toLowerCase();
          return (vaRouteId && targetRouteCodes.includes(vaRouteId)) || (vaRouteName && targetRouteCodes.includes(vaRouteName));
        }) || vehicleAssignments.find(va => {
          const vaRouteId = String(va.routeId || '').replace(/^rm-0*/i, '').trim().toLowerCase();
          const vaRouteName = String(va.routeName || '').replace(/\s+/g, ' ').trim().toLowerCase();
          return (vaRouteId && targetRouteCodes.includes(vaRouteId)) || (vaRouteName && targetRouteCodes.includes(vaRouteName));
        });

        const vehicle = vehicleMasters.find(v => String(v.id) === String(assignment?.vehicleId));
        const vehicleNum = vehicle?.vehicleNumber || assignment?.vehicleNumber || (fullRouteObj.assignedVehicleNumber && fullRouteObj.assignedVehicleNumber !== 'Unassigned' ? fullRouteObj.assignedVehicleNumber : '') || (fullRouteObj.assignedBus && fullRouteObj.assignedBus !== 'Unassigned' ? fullRouteObj.assignedBus : '') || 'Unassigned';
        const driverName = assignment?.driverName || (fullRouteObj.assignedDriverName && fullRouteObj.assignedDriverName !== 'Unassigned' ? fullRouteObj.assignedDriverName : '') || (fullRouteObj.assignedDriver && fullRouteObj.assignedDriver !== 'Unassigned' ? fullRouteObj.assignedDriver : '') || 'Unassigned';
        const attendantName = assignment?.attendantName || (fullRouteObj.assignedAttendantName && fullRouteObj.assignedAttendantName !== 'Unassigned' ? fullRouteObj.assignedAttendantName : '') || 'Unassigned';

        // Filtered Students
        const filteredStudents = allStudentsInRoute.filter((st) => {
          const matchQuery =
            !routeStudentSearch ||
            st.name.toLowerCase().includes(routeStudentSearch.toLowerCase()) ||
            st.admissionNo.toLowerCase().includes(routeStudentSearch.toLowerCase()) ||
            st.className.toLowerCase().includes(routeStudentSearch.toLowerCase()) ||
            st.pickupStop.toLowerCase().includes(routeStudentSearch.toLowerCase());

          const matchStatus =
            routeStudentFilter === 'All' ||
            (routeStudentFilter === 'Pending' && st.dueAmount > 0) ||
            (routeStudentFilter === 'Paid' && st.status === 'Paid');

          return matchQuery && matchStatus;
        });

        const totalExpected = allStudentsInRoute.reduce((sum, s) => sum + s.totalFee, 0);
        const totalCollected = allStudentsInRoute.reduce((sum, s) => sum + s.paidAmount, 0);
        const totalPending = allStudentsInRoute.reduce((sum, s) => sum + s.dueAmount, 0);
        const pendingCount = allStudentsInRoute.filter(s => s.dueAmount > 0).length;
        const paidCount = allStudentsInRoute.filter(s => s.status === 'Paid').length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <RouteIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {fullRouteObj.routeName || 'Transit Route'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">
                        {fullRouteObj.routeCode || '-'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Bus: <strong className="text-slate-800 dark:text-slate-200">{vehicleNum}</strong>{vehicleNum !== 'Unassigned' ? ` (${vehicle?.isAC ? 'AC' : 'Non-AC'})` : ''}</span>
                      <span>•</span>
                      <span>Driver: <strong className="text-slate-800 dark:text-slate-200">{driverName}</strong></span>
                      {attendantName !== 'Unassigned' && (
                        <>
                          <span>•</span>
                          <span>Attendant: <strong className="text-slate-800 dark:text-slate-200">{attendantName}</strong></span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Print & Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintAllRouteStudents(fullRouteObj, allStudentsInRoute)}
                    className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:hover:bg-sky-900 dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs border border-sky-200 dark:border-sky-800"
                    title="Print all students on this route"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print All</span>
                  </button>

                  <button
                    onClick={() => handlePrintPendingRouteStudents(fullRouteObj, allStudentsInRoute)}
                    disabled={pendingCount === 0}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs border ${
                      pendingCount > 0
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 border-transparent cursor-not-allowed'
                    }`}
                    title="Print students with pending fees"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Print Pending Fee ({pendingCount})</span>
                  </button>

                  <button
                    onClick={() => handleExportRouteStudents(fullRouteObj, allStudentsInRoute)}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs border border-emerald-200 dark:border-emerald-800"
                    title="Export route student list to Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => setSelectedRouteForStudents(null)}
                    className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer ml-1"
                    title="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase">
                    <span>Total Students</span>
                    <Users className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {allStudentsInRoute.length}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase">
                    <span>Total Expected</span>
                    <IndianRupee className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {formatCurrency(totalExpected)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase">
                    <span>Total Collected</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(totalCollected)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-[11px] font-bold uppercase">
                    <span>Pending Dues</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {formatCurrency(totalPending)}
                  </div>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setRouteStudentFilter('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      routeStudentFilter === 'All'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    All Students ({allStudentsInRoute.length})
                  </button>

                  <button
                    onClick={() => setRouteStudentFilter('Pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      routeStudentFilter === 'Pending'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    Pending Dues ({pendingCount})
                  </button>

                  <button
                    onClick={() => setRouteStudentFilter('Paid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      routeStudentFilter === 'Paid'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    Paid in Full ({paidCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, adm no, stop..."
                    value={routeStudentSearch}
                    onChange={(e) => setRouteStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-y-auto flex-1 p-5">
                {filteredStudents.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                          <th className="py-3 px-3 text-center w-12">#</th>
                          <th className="py-3 px-4">Student & Adm No</th>
                          <th className="py-3 px-4 text-center">Class</th>
                          <th className="py-3 px-4">Pickup Stop</th>
                          <th className="py-3 px-4 text-right">Fee (₹)</th>
                          <th className="py-3 px-4 text-right">Paid (₹)</th>
                          <th className="py-3 px-4 text-right">Due (₹)</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredStudents.map((st, idx) => (
                          <tr key={st.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-slate-900 dark:text-white">
                                {st.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Adm: {st.admissionNo} {st.rollNo !== '-' ? `• Roll: ${st.rollNo}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                                {st.className} - {st.section}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{st.pickupStop}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block ml-4">
                                {st.distanceKm} KM from school
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-slate-700 dark:text-slate-300">
                              {formatCurrency(st.totalFee)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(st.paidAmount)}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-xs">
                              <span className={st.dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                {formatCurrency(st.dueAmount)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={st.status === 'Paid' ? 'success' : st.status === 'Partial' ? 'warning' : 'danger'}>
                                {st.status === 'Paid' ? 'Paid' : st.status === 'Partial' ? 'Partial' : 'Pending'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{st.parentContact}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {routeStudentSearch ? 'No matching students found for this search.' : 'No students assigned to this route yet.'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Students can be assigned to routes in Transport Management &rarr; Student Assignment.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
                <span>Showing <strong>{filteredStudents.length}</strong> of <strong>{allStudentsInRoute.length}</strong> students</span>
                <button
                  onClick={() => setSelectedRouteForStudents(null)}
                  className="px-4 py-2 font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Override Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-500" />
                {editingConfig ? 'Edit Transport Fee Override' : 'Configure Transport Fee Override'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Route Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Route <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={form.routeId}
                  onChange={e => handleRouteSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-extrabold text-slate-900 dark:text-white cursor-pointer"
                >
                  {routeMasters.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.routeName} ({r.routeCode || 'No Code'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pickup Point Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pickup Point Stop <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={form.pickupPointId}
                  onChange={e => handlePickupSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-extrabold text-slate-900 dark:text-white cursor-pointer"
                >
                  {routeStops.length > 0 ? (
                    routeStops.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.sequenceNumber ?? 1}. {p.pickupName} ({p.distanceFromSchoolKm ?? 0} KM)
                      </option>
                    ))
                  ) : (
                    <option value="">No pickup points created for this route</option>
                  )}
                </select>
              </div>

              {/* Billing Policy & Fee Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Billing Policy <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={form.feePlan}
                    onChange={e => {
                      const newPlan = e.target.value;
                      const fees = calculateStopFees(form.routeId, form.pickupPointId);
                      const amt = newPlan === 'Annual' ? fees.oneTimeAnnual : fees.termWise;
                      setForm({ ...form, feePlan: newPlan as any, feeAmount: amt });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold cursor-pointer"
                  >
                    <option value="Annual">One-Time Fee (Full Annual)</option>
                    <option value="Quarterly">Term-Wise Fee (Per Term)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fee Amount (₹) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.feeAmount}
                    onChange={e => setForm({ ...form, feeAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-black text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* Effective Dates & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={e => setForm({ ...form, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-500 transition-all"
                >
                  Save Transport Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingConfig}
        onCancel={() => setDeletingConfig(null)}
        onConfirm={() => {
          if (deletingConfig) {
            deleteFinanceTransportConfig(deletingConfig.id);
            addToast('info', 'Transport Override Deleted');
            setDeletingConfig(null);
          }
        }}
        title="Delete Transport Fee Override"
        message={`Are you sure you want to remove custom transport pricing for ${deletingConfig?.pickupName}?`}
      />
    </div>
  );
};

export default FinanceTransportConfigView;
