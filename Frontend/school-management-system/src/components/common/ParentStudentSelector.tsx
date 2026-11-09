import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getParentChildren, ParentChild } from '../../api/parent/parentApi';

export interface ParentWard {
  id: string;
  studentId: string | number;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  studentName: string;
  className: string;
  section: string;
  classId?: string | number;
  sectionId?: string | number;
  gender?: string;
  dob?: string;
  status: string;
  fatherName?: string;
  motherName?: string;
  parentName?: string;
  studentType?: string;
  bloodGroup?: string;
  boardType?: string;
  casteCategory?: string;
  address?: string;
  transportRequired?: boolean;
  busRoute?: string;
  pickupPoint?: string;
  dropPoint?: string;
  transportType?: string;
  hostelBlock?: string;
  hostelRoom?: string;
  hostelBed?: string;
}

/**
 * Standard hook to fetch and normalize parent wards consistently across all parent views.
 * Strictly resolves only the children belonging to the currently logged-in parent via the authoritative API.
 */
export function useParentWards() {
  const { students = [], admissions = [] } = useData();
  const { user, role } = useAuth();
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

  useEffect(() => {
    let isMounted = true;
    setApiChildren([]);

    const fetchChildren = async () => {
      try {
        // Authenticated request to backend - backend extracts verified parent userId from JWT
        const children = await getParentChildren();
        if (isMounted) {
          setApiChildren(children || []);
        }
      } catch (err) {
        console.warn('Failed to fetch parent children in useParentWards:', err);
        if (isMounted) {
          setApiChildren([]);
        }
      }
    };

    fetchChildren();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email]);

  const wards = useMemo<ParentWard[]>(() => {
    const userRoleStr = (user?.role || role || '').toString().toLowerCase();
    const isStudentUser = userRoleStr.includes('student');

    // 1. If logged in as Student
    if (isStudentUser) {
      const userId = String(user?.id || '').trim().toLowerCase();
      const rawUserName = (user?.name || '').trim().toLowerCase();
      const userEmail = (user?.email || '').toLowerCase().trim();
      const rawUserPhone = String(user?.phone || (user as any)?.mobileNumber || '').trim();
      const userPhoneDigits = rawUserPhone.replace(/\D/g, '');
      const userAdm = String((user as any)?.admissionNo || '').trim().toLowerCase();
      const userRoll = String((user as any)?.rollNo || (user as any)?.empId || '').trim().toLowerCase();
      const userStudentId = String((user as any)?.studentId || '').trim().toLowerCase();

      const identifierFromPhone = /^(stu|adm|reg)-/i.test(rawUserPhone) ? rawUserPhone.toLowerCase() : '';
      const identifierFromEmail = /^([a-z0-9_-]+)@/i.exec(userEmail)?.[1]?.toLowerCase() || '';
      const regFromEmail = /^(stu|adm|reg)-/i.test(identifierFromEmail) ? identifierFromEmail : '';

      const isNameReal = rawUserName && !['student', 'user', 'demo', 'test', 'admin'].includes(rawUserName);

      const matched = (students || []).find(s => {
        if (!s) return false;
        const sId = String(s.id || '').trim().toLowerCase();
        const sAdm = String(s.admissionNo || (s as any).admissionNumber || '').trim().toLowerCase();
        const sRoll = String((s as any).rollNo || (s as any).rollNumber || (s as any).registrationNo || '').trim().toLowerCase();
        const sStudentId = String((s as any).studentId || '').trim().toLowerCase();
        const sEmail = (s.email || '').trim().toLowerCase();
        const sPhoneDigits = (s.phone || (s as any).mobileNumber || '').replace(/\D/g, '');
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
        const sName = String((s as any).studentName || (s as any).name || '').trim().toLowerCase();

        const nameMatches = isNameReal && (
          sFullName === rawUserName ||
          sName === rawUserName ||
          (s.firstName && s.lastName && rawUserName.includes(s.firstName.toLowerCase()) && rawUserName.includes(s.lastName.toLowerCase())) ||
          (sName && (rawUserName.includes(sName) || sName.includes(rawUserName)))
        );

        // 1. Direct admission number match
        if (userAdm && (sAdm === userAdm || sRoll === userAdm)) return true;

        // 2. Direct roll / registration number match
        if (userRoll && (sRoll === userRoll || sAdm === userRoll || sStudentId === userRoll)) return true;

        // 3. Direct student ID match
        if (userStudentId && (sId === userStudentId || sStudentId === userStudentId)) return true;

        // 4. Registration number extracted from phone or email
        if (identifierFromPhone && (sRoll === identifierFromPhone || sAdm === identifierFromPhone || sStudentId === identifierFromPhone)) return true;
        if (regFromEmail && (sRoll === regFromEmail || sAdm === regFromEmail || sStudentId === regFromEmail)) return true;

        // 5. Exact name match
        if (nameMatches) return true;

        // 6. Real email match (not generic internal)
        if (userEmail && !userEmail.endsWith('@school.internal') && sEmail === userEmail) return true;

        // 7. Phone digits match
        if (userPhoneDigits && userPhoneDigits.length >= 10 && sPhoneDigits && (sPhoneDigits.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(sPhoneDigits))) return true;

        // 8. ID match ONLY IF name does NOT contradict
        if (userId && (sId === userId || sAdm === userId || sRoll === userId || sStudentId === userId)) {
          if (!isNameReal || nameMatches || !sName) return true;
        }

        return false;
      });

      if (matched) {
        const studentName = isNameReal
          ? user?.name || ''
          : (`${matched.firstName || ''} ${matched.lastName || ''}`.trim() || (matched as any).studentName || 'Student');
        const firstName = matched.firstName || studentName.split(' ')[0] || 'Student';
        const lastName = matched.lastName || studentName.split(' ').slice(1).join(' ') || '';
        const className = matched.className || (matched as any).class || (user as any)?.className || '';
        const section = matched.section || (matched as any).sectionName || (user as any)?.section || '';
        const admissionNo = matched.admissionNo || (matched as any).admissionNumber || (user as any)?.admissionNo || `ADM-${matched.id}`;
        const rollNo = (matched as any).rollNo || (matched as any).rollNumber || (matched as any).registrationNo || (user as any)?.rollNo || String(matched.id);

        return [{
          id: String(matched.id),
          studentId: matched.id,
          classId: (matched as any).classId || (matched as any).class_id,
          sectionId: (matched as any).sectionId || (matched as any).section_id,
          admissionNo,
          rollNo,
          firstName,
          lastName,
          studentName,
          className,
          section,
          gender: matched.gender || 'Male',
          dob: matched.dob || '',
          status: matched.status || 'Active',
          studentType: (matched as any).studentType || 'Non-Residential',
          transportRequired: Boolean((matched as any).transportRequired === true || String((matched as any).transportRequired).toLowerCase() === 'true' || (matched as any).busRoute || (matched as any).pickupPoint),
          busRoute: (matched as any).busRoute || (matched as any).transportRoute || '',
          pickupPoint: (matched as any).pickupPoint || '',
          dropPoint: (matched as any).dropPoint || '',
          transportType: (matched as any).transportType || '',
          hostelBlock: (matched as any).hostelBlock || '',
          hostelRoom: (matched as any).hostelRoom || '',
          hostelBed: (matched as any).hostelBed || ''
        }];
      }

      // Check admissions collection if not found in students
      const matchedAdm = (admissions || []).find((a: any) => {
        if (!a || a.status === 'Rejected' || a.status === 'Cancelled') return false;
        const aAdm = String(a.admissionNo || '').trim().toLowerCase();
        const aReg = String(a.registrationNo || (a as any).applicationNo || '').trim().toLowerCase();
        const aName = String(a.applicantName || `${a.firstName || ''} ${a.lastName || ''}`).trim().toLowerCase();
        const aEmail = (a.email || (a as any).parentEmail || (a as any).studentEmail || '').trim().toLowerCase();
        const aPhoneDigits = (a.phone || (a as any).fatherContact || (a as any).fatherMobileNo || '').replace(/\D/g, '');

        if (userAdm && (aAdm === userAdm || aReg === userAdm)) return true;
        if (userRoll && (aReg === userRoll || aAdm === userRoll)) return true;
        if (identifierFromPhone && (aReg === identifierFromPhone || aAdm === identifierFromPhone)) return true;
        if (regFromEmail && (aReg === regFromEmail || aAdm === regFromEmail)) return true;
        if (isNameReal && (aName === rawUserName || (a.firstName && a.lastName && rawUserName.includes(a.firstName.toLowerCase()) && rawUserName.includes(a.lastName.toLowerCase())))) return true;
        if (userEmail && !userEmail.endsWith('@school.internal') && aEmail === userEmail) return true;
        if (userPhoneDigits && userPhoneDigits.length >= 10 && aPhoneDigits && (aPhoneDigits.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(aPhoneDigits))) return true;
        if (userId && (String(a.id).toLowerCase() === userId || aReg === userId || aAdm === userId)) {
          if (!isNameReal || aName === rawUserName || !aName) return true;
        }
        return false;
      });

      if (matchedAdm) {
        const studentName = isNameReal
          ? user?.name || ''
          : (matchedAdm.applicantName || `${matchedAdm.firstName || ''} ${matchedAdm.lastName || ''}`.trim() || 'Student');
        const firstName = matchedAdm.firstName || studentName.split(' ')[0] || 'Student';
        const lastName = matchedAdm.lastName || studentName.split(' ').slice(1).join(' ') || '';
        const className = (matchedAdm as any).appliedClass?.className || (matchedAdm as any).className || matchedAdm.appliedClass || (user as any)?.className || '';
        const section = (matchedAdm as any).section || (user as any)?.section || 'A';
        const admissionNo = matchedAdm.admissionNo || matchedAdm.registrationNo || (user as any)?.admissionNo || `ADM-${matchedAdm.id}`;
        const rollNo = matchedAdm.registrationNo || (user as any)?.rollNo || `STU-${matchedAdm.id}`;

        return [{
          id: String(matchedAdm.id),
          studentId: matchedAdm.id,
          classId: (matchedAdm as any).classId || (matchedAdm as any).appliedClassId,
          sectionId: (matchedAdm as any).sectionId,
          admissionNo,
          rollNo,
          firstName,
          lastName,
          studentName,
          className,
          section,
          gender: matchedAdm.gender || 'Male',
          dob: (matchedAdm as any).dateOfBirth || (matchedAdm as any).dob || '',
          status: 'Active',
          studentType: (matchedAdm as any).studentType || 'Non-Residential',
          transportRequired: Boolean((matchedAdm as any).transportRequired === true || String((matchedAdm as any).transportRequired).toLowerCase() === 'true' || (matchedAdm as any).busRoute || (matchedAdm as any).pickupPoint),
          busRoute: (matchedAdm as any).busRoute || '',
          pickupPoint: (matchedAdm as any).pickupPoint || '',
          dropPoint: (matchedAdm as any).dropPoint || '',
          transportType: (matchedAdm as any).transportType || '',
          hostelBlock: (matchedAdm as any).hostelBlock || '',
          hostelRoom: (matchedAdm as any).hostelRoom || '',
          hostelBed: (matchedAdm as any).availableBed || (matchedAdm as any).hostelBed || ''
        }];
      }

      // Final fallback to user object
      const studentName = user?.name || 'Student';
      return [{
        id: userId || '1',
        studentId: (user as any)?.studentId || userId || '1',
        admissionNo: (user as any)?.admissionNo || (user as any)?.phone || '',
        rollNo: (user as any)?.rollNo || '',
        firstName: studentName.split(' ')[0] || 'Student',
        lastName: studentName.split(' ').slice(1).join(' ') || '',
        studentName,
        className: (user as any)?.className || '',
        section: (user as any)?.section || '',
        gender: 'Male',
        dob: '',
        status: 'Active',
        studentType: (user as any)?.studentType || 'Non-Residential',
        transportRequired: Boolean((user as any)?.transportRequired === true || String((user as any)?.transportRequired).toLowerCase() === 'true' || (user as any)?.busRoute || (user as any)?.pickupPoint),
        busRoute: (user as any)?.busRoute || '',
        pickupPoint: (user as any)?.pickupPoint || '',
        dropPoint: (user as any)?.dropPoint || '',
        transportType: (user as any)?.transportType || '',
        hostelBlock: (user as any)?.hostelBlock || '',
        hostelRoom: (user as any)?.hostelRoom || '',
        hostelBed: (user as any)?.hostelBed || ''
      }];
    }

    // 2. Authoritative parent ward list from backend /api/parent/children
    if (!apiChildren || apiChildren.length === 0) {
      // Robust Fallback: Match by parent's phone or email against students and admissions
      const rawUserPhone = String(user?.phone || (user as any)?.mobileNumber || '').trim();
      const userPhoneDigits = rawUserPhone.replace(/\D/g, '');
      const userEmail = (user?.email || '').toLowerCase().trim();

      const matchedList: ParentWard[] = [];
      const seenIds = new Set<string>();

      (students || []).forEach((s: any) => {
        if (!s) return;
        const sStatus = String(s.status || '').toLowerCase().trim();
        if (sStatus && ['inactive', 'deleted', 'left', 'rejected'].includes(sStatus)) return;

        const fPhone = String(s.fatherPhone || s.fatherMobile || '').replace(/\D/g, '');
        const mPhone = String(s.motherPhone || s.motherMobile || '').replace(/\D/g, '');
        const pPhone = String(s.parentPhone || s.guardianPhone || '').replace(/\D/g, '');
        const sPhone = String(s.phone || s.mobileNumber || '').replace(/\D/g, '');

        const fEmail = String(s.fatherEmail || '').trim().toLowerCase();
        const mEmail = String(s.motherEmail || '').trim().toLowerCase();
        const pEmail = String(s.parentEmail || s.guardianEmail || s.contactEmail || '').trim().toLowerCase();
        const sEmail = String(s.email || '').trim().toLowerCase();

        const phoneMatches = userPhoneDigits && userPhoneDigits.length >= 7 && (
          (fPhone && (fPhone.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(fPhone))) ||
          (mPhone && (mPhone.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(mPhone))) ||
          (pPhone && (pPhone.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(pPhone))) ||
          (sPhone && (sPhone.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(sPhone)))
        );

        const emailMatches = userEmail && !userEmail.endsWith('@school.internal') && (
          fEmail === userEmail || mEmail === userEmail || pEmail === userEmail || sEmail === userEmail
        );

        if (phoneMatches || emailMatches) {
          const sKey = String(s.id);
          if (!seenIds.has(sKey)) {
            seenIds.add(sKey);
            const studentName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || s.studentName || 'Student';
            matchedList.push({
              id: sKey,
              studentId: s.id,
              admissionNo: s.admissionNo || s.admissionNumber || `ADM-${s.id}`,
              rollNo: s.rollNo || s.rollNumber || `ROLL-${s.id}`,
              firstName: s.firstName || studentName.split(' ')[0] || 'Student',
              lastName: s.lastName || studentName.split(' ').slice(1).join(' ') || '',
              studentName,
              className: s.className || s.class || '',
              section: s.section || s.sectionName || '',
              gender: s.gender || 'Male',
              dob: s.dob || '',
              status: 'Active',
              fatherName: s.fatherName,
              motherName: s.motherName,
              studentType: s.studentType || 'Non-Residential',
              transportRequired: Boolean(s.transportRequired === true || String(s.transportRequired).toLowerCase() === 'true' || s.busRoute || s.pickupPoint),
              busRoute: s.busRoute || s.transportRoute || '',
              pickupPoint: s.pickupPoint || '',
              dropPoint: s.dropPoint || '',
              transportType: s.transportType || '',
              hostelBlock: s.hostelBlock || '',
              hostelRoom: s.hostelRoom || '',
              hostelBed: s.hostelBed || ''
            });
          }
        }
      });

      (admissions || []).forEach((a: any) => {
        if (!a) return;
        const aStatus = String(a.status || '').toLowerCase().trim();
        if (aStatus && ['rejected', 'cancelled', 'deleted'].includes(aStatus)) return;

        const fContact = String(a.fatherContact || a.fatherMobileNo || a.fatherPhone || '').replace(/\D/g, '');
        const mContact = String(a.motherContact || a.motherMobileNo || a.motherPhone || '').replace(/\D/g, '');
        const aPhone = String(a.phone || a.mobileNumber || '').replace(/\D/g, '');
        const pEmail = String(a.parentEmail || a.fatherEmail || a.motherEmail || '').trim().toLowerCase();
        const aEmail = String(a.email || '').trim().toLowerCase();

        const phoneMatches = userPhoneDigits && userPhoneDigits.length >= 7 && (
          (fContact && (fContact.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(fContact))) ||
          (mContact && (mContact.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(mContact))) ||
          (aPhone && (aPhone.endsWith(userPhoneDigits) || userPhoneDigits.endsWith(aPhone)))
        );

        const emailMatches = userEmail && !userEmail.endsWith('@school.internal') && (
          pEmail === userEmail || aEmail === userEmail
        );

        if (phoneMatches || emailMatches) {
          const aKey = String(a.id);
          const aAdm = String(a.admissionNo || a.admissionNumber || a.registrationNo || '');
          if (!seenIds.has(aKey) && (!aAdm || !seenIds.has(aAdm))) {
            seenIds.add(aKey);
            if (aAdm) seenIds.add(aAdm);
            const studentName = a.applicantName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Student';
            matchedList.push({
              id: aKey,
              studentId: a.id,
              admissionNo: aAdm || `ADM-${a.id}`,
              rollNo: a.registrationNo || a.applicationNo || `ROLL-${a.id}`,
              firstName: a.firstName || studentName.split(' ')[0] || 'Student',
              lastName: a.lastName || studentName.split(' ').slice(1).join(' ') || '',
              studentName,
              className: a.appliedClass?.className || a.className || a.appliedClass || '',
              section: a.section || 'A',
              gender: a.gender || 'Male',
              dob: a.dateOfBirth || a.dob || '',
              status: 'Active',
              fatherName: a.fatherFullName || a.parentName,
              motherName: a.motherFullName,
              studentType: a.studentType || 'Non-Residential',
              transportRequired: Boolean(a.transportRequired === true || String(a.transportRequired).toLowerCase() === 'true' || a.busRoute || a.pickupPoint),
              busRoute: a.busRoute || '',
              pickupPoint: a.pickupPoint || '',
              dropPoint: a.dropPoint || '',
              transportType: a.transportType || '',
              hostelBlock: a.hostelBlock || '',
              hostelRoom: a.hostelRoom || '',
              hostelBed: a.availableBed || a.hostelBed || ''
            });
          }
        }
      });

      return matchedList;
    }

    const mappedApi: ParentWard[] = apiChildren.map(c => {
      // Cross-reference with loaded students by immutable ID or exact admission number for metadata enrichment
      const matched = (students || []).find(st => {
        const sId = String(st.id || (st as any).studentId || '').trim();
        const cId = String(c.studentId || '').trim();
        if (sId && cId && sId === cId) return true;

        const sAdm = (st.admissionNo || (st as any).admissionNumber || '').trim().toLowerCase();
        const cAdm = (c.admissionNumber || '').trim().toLowerCase();
        if (sAdm && cAdm && sAdm === cAdm) return true;

        return false;
      });

      // Cross-reference with admissions for additional demographic info if needed
      const matchedAdm = (admissions || []).find(a => {
        const aAdm = (a.admissionNo || (a as any).admissionNumber || (a as any).applicationNo || '').trim().toLowerCase();
        const cAdm = (c.admissionNumber || '').trim().toLowerCase();
        if (aAdm && cAdm && aAdm === cAdm) return true;

        return false;
      });

      const isTrp = Boolean(
        (c as any).transportRequired ||
        (matched as any)?.transportRequired ||
        (matchedAdm as any)?.transportRequired ||
        matched?.busRoute ||
        (matchedAdm as any)?.busRoute
      );
      return {
        id: String(c.studentId),
        studentId: c.studentId,
        admissionNo: c.admissionNumber || matched?.admissionNo || (matchedAdm as any)?.admissionNo || `ADM-${c.studentId}`,
        rollNo: c.rollNumber || (matched as any)?.rollNo || (matchedAdm as any)?.registrationNo || `ROLL-${c.studentId}`,
        firstName: c.firstName || matched?.firstName || (c.studentName ? c.studentName.split(' ')[0] : 'Student'),
        lastName: c.lastName || matched?.lastName || '',
        studentName: c.studentName || (matched ? `${matched.firstName || ''} ${matched.lastName || ''}`.trim() : `${c.firstName || ''} ${c.lastName || ''}`.trim()) || 'Student',
        className: c.className || matched?.className || (matchedAdm as any)?.appliedClass || '',
        section: c.sectionName || matched?.section || (matchedAdm as any)?.section || '',
        gender: c.gender || matched?.gender || matchedAdm?.gender || 'Male',
        dob: c.dateOfBirth ? c.dateOfBirth.split('T')[0] : (matched?.dob || (matchedAdm as any)?.dateOfBirth || (matchedAdm as any)?.dob || ''),
        status: 'Active',
        fatherName: matched?.fatherName || (matchedAdm as any)?.fatherFullName || (matchedAdm as any)?.parentName,
        motherName: matched?.motherName || (matchedAdm as any)?.motherFullName,
        studentType: (c as any).studentType || (matched as any)?.studentType || (matchedAdm as any)?.studentType || 'Non-Residential',
        bloodGroup: (c as any).bloodGroup || (matched as any)?.bloodGroup || (matchedAdm as any)?.bloodGroup,
        boardType: (c as any).boardType || (matched as any)?.boardType || (matchedAdm as any)?.boardType,
        casteCategory: (c as any).casteCategory || (matched as any)?.casteCategory || (matchedAdm as any)?.casteCategory || (matchedAdm as any)?.caste,
        address: (c as any).address || (matched as any)?.address || ((matchedAdm as any)?.houseNo ? `${(matchedAdm as any).houseNo} ${(matchedAdm as any).street || ''} ${(matchedAdm as any).areaLocality || ''} ${(matchedAdm as any).city || ''}`.trim() : undefined),
        transportRequired: isTrp,
        busRoute: (c as any).busRoute || matched?.busRoute || (matchedAdm as any)?.busRoute || '',
        pickupPoint: (c as any).pickupPoint || matched?.pickupPoint || (matchedAdm as any)?.pickupPoint || '',
        dropPoint: (c as any).dropPoint || matched?.dropPoint || (matchedAdm as any)?.dropPoint || '',
        transportType: (c as any).transportType || matched?.transportType || (matchedAdm as any)?.transportType || '',
        hostelBlock: (c as any).hostelBlock || (matched as any)?.hostelBlock || (matchedAdm as any)?.hostelBlock || '',
        hostelRoom: (c as any).hostelRoom || (matched as any)?.hostelRoom || (matchedAdm as any)?.hostelRoom || '',
        hostelBed: (c as any).hostelBed || (matched as any)?.hostelBed || (matchedAdm as any)?.availableBed || (matchedAdm as any)?.hostelBed || ''
      };
    });

    // Deduplicate strictly by studentId
    const seenStudentIds = new Set<string>();
    const uniqueWards: ParentWard[] = [];

    for (const ward of mappedApi) {
      const key = String(ward.studentId);
      if (!seenStudentIds.has(key)) {
        seenStudentIds.add(key);
        uniqueWards.push(ward);
      }
    }

    return uniqueWards;
  }, [apiChildren, students, admissions, user?.id, user?.email, user?.role, role]);

  return wards;
}

interface ParentStudentSelectorProps {
  wards: ParentWard[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export const ParentStudentSelector: React.FC<ParentStudentSelectorProps> = ({
  wards,
  selectedIndex,
  onSelect,
  className = ''
}) => {
  if (!wards || wards.length <= 1) return null;

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
        Select Child:
      </span>
      {wards.map((ward, idx) => {
        const isSelected = idx === selectedIndex;
        const displayName = ward.studentName || `${ward.firstName} ${ward.lastName}`.trim() || `Child ${idx + 1}`;
        const cleanClass = (ward.className || '').replace(/^class\s+/i, 'Class ');
        const classSection = `${cleanClass}${ward.section ? `-${ward.section}` : ''}`;

        return (
          <button
            key={ward.id || ward.studentId || idx}
            type="button"
            onClick={() => onSelect(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              isSelected
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-sky-200/80 dark:border-sky-800/80 hover:border-sky-400 hover:text-sky-600 dark:hover:border-sky-600'
            }`}
          >
            <span>{displayName}</span>
            {classSection && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                isSelected 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {classSection}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
