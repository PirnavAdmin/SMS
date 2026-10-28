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
}

/**
 * Standard hook to fetch and normalize parent wards consistently across all parent views.
 * Strictly resolves only the children belonging to the currently logged-in parent.
 */
export function useParentWards() {
  const { students = [], admissions = [] } = useData();
  const { user, role } = useAuth();
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      try {
        const identifier = user?.email || user?.phone || user?.name;
        if (!identifier) return;
        const children = await getParentChildren(identifier);
        if (isMounted) {
          setApiChildren(children || []);
        }
      } catch (err) {
        console.warn('Failed to fetch parent children in useParentWards:', err);
      }
    };
    fetchChildren();
    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.phone, user?.name]);

  const wards = useMemo<ParentWard[]>(() => {
    const userRoleStr = (user?.role || role || '').toString().toLowerCase();
    const isStudentUser = userRoleStr.includes('student');
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userPhone = (user?.phone || (user as any)?.mobileNumber || '').replace(/\D/g, '');
    const userId = String(user?.id || '').trim().toLowerCase();
    const userName = (user?.name || (user as any)?.fullName || '').trim().toLowerCase();

    // 1. If logged in as Student
    if (isStudentUser) {
      const matched = (students || []).find(s => {
        if (!s) return false;
        const sId = String(s.id || '').trim().toLowerCase();
        const sAdm = String(s.admissionNo || (s as any).admissionNumber || '').trim().toLowerCase();
        const sRoll = String((s as any).rollNo || (s as any).rollNumber || '').trim().toLowerCase();
        const sEmail = (s.email || '').trim().toLowerCase();
        const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();

        if (userId && (sId === userId || sAdm === userId || sRoll === userId)) return true;
        if (userEmail && sEmail === userEmail) return true;
        if (userPhone && userPhone.length >= 7) {
          const sPhone = (s.phone || (s as any).mobileNumber || '').replace(/\D/g, '');
          if (sPhone && (sPhone.endsWith(userPhone) || userPhone.endsWith(sPhone))) return true;
        }
        if (userName && (sName === userName || (s.firstName && userName.includes(s.firstName.toLowerCase())))) return true;
        return false;
      });

      if (matched) {
        return [{
          id: String(matched.id),
          studentId: matched.id,
          admissionNo: matched.admissionNo || `ADM-${matched.id}`,
          rollNo: (matched as any).rollNo || (matched as any).rollNumber || String(matched.id),
          firstName: matched.firstName || '',
          lastName: matched.lastName || '',
          studentName: `${matched.firstName || ''} ${matched.lastName || ''}`.trim() || matched.firstName || 'Student',
          className: matched.className || (matched as any).class || '',
          section: matched.section || '',
          gender: matched.gender || 'Male',
          dob: matched.dob || '',
          status: matched.status || 'Active',
          studentType: (matched as any).studentType || 'Day Scholar'
        }];
      }

      return [{
        id: String(user?.id || '1'),
        studentId: user?.id || '1',
        admissionNo: (user as any)?.admissionNo || 'ADM-STU-1',
        rollNo: (user as any)?.rollNo || 'ROLL-1',
        firstName: user?.name?.split(' ')[0] || 'Student',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        studentName: user?.name || 'Student',
        className: (user as any)?.className || (user as any)?.class || 'Class 10',
        section: (user as any)?.section || 'A',
        gender: 'Male',
        dob: '',
        status: 'Active',
        studentType: 'Day Scholar'
      }];
    }

    // 2. From API Children (authoritative backend endpoint /api/parent/children)
    const mappedApi: ParentWard[] = (apiChildren || []).map(c => {
      // Find matching student in students array to inherit enriched data
      const matched = (students || []).find(st => {
        const sId = String(st.id || (st as any).studentId || '').trim().toLowerCase();
        const cId = String(c.studentId || '').trim().toLowerCase();
        if (sId && cId && sId === cId) return true;

        const sAdm = (st.admissionNo || (st as any).admissionNumber || '').trim().toLowerCase();
        const cAdm = (c.admissionNumber || '').trim().toLowerCase();
        if (sAdm && cAdm && sAdm === cAdm) return true;

        const sRoll = String((st as any).rollNo || (st as any).rollNumber || '').trim().toLowerCase();
        const cRoll = (c.rollNumber || '').trim().toLowerCase();
        if (sRoll && cRoll && sRoll === cRoll) return true;

        return false;
      });

      // Find matching admission for any additional profile details (bloodGroup, studentType, caste)
      const matchedAdm = (admissions || []).find(a => {
        const aAdm = (a.admissionNo || (a as any).admissionNumber || (a as any).applicationNo || '').trim().toLowerCase();
        const cAdm = (c.admissionNumber || '').trim().toLowerCase();
        if (aAdm && cAdm && aAdm === cAdm) return true;

        const aReg = String((a as any).registrationNo || (a as any).registrationNumber || (a as any).rollNo || '').trim().toLowerCase();
        const cRoll = (c.rollNumber || '').trim().toLowerCase();
        if (aReg && cRoll && aReg === cRoll) return true;

        const cName = (c.studentName || `${c.firstName || ''} ${c.lastName || ''}`).trim().toLowerCase().replace(/\s+/g, ' ');
        const aName = ((a as any).applicantFullName || (a as any).applicantName || `${(a as any).firstName || ''} ${(a as any).lastName || ''}`).trim().toLowerCase().replace(/\s+/g, ' ');
        if (cName && aName && cName === aName) return true;

        return false;
      });

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
        studentType: (c as any).studentType || (matched as any)?.studentType || (matchedAdm as any)?.studentType || 'Day Scholar',
        bloodGroup: (c as any).bloodGroup || (matched as any)?.bloodGroup || (matchedAdm as any)?.bloodGroup,
        boardType: (c as any).boardType || (matched as any)?.boardType || (matchedAdm as any)?.boardType,
        casteCategory: (c as any).casteCategory || (matched as any)?.casteCategory || (matchedAdm as any)?.casteCategory || (matchedAdm as any)?.caste,
        address: (c as any).address || (matched as any)?.address || ((matchedAdm as any)?.houseNo ? `${(matchedAdm as any).houseNo} ${(matchedAdm as any).street || ''} ${(matchedAdm as any).areaLocality || ''} ${(matchedAdm as any).city || ''}`.trim() : undefined)
      };
    });

    // 3. Fallback: From Local Students database matches (ONLY used if apiChildren is empty)
    const nameTokens = userName ? userName.split(/\s+/).filter((t: string) => t.length >= 3) : [];
    const isGenericUser = ['parent', 'user', 'administrator', 'admin', 'guest'].includes(userName);

    const localStudentMatches: ParentWard[] = (students || []).filter(s => {
      if (s.status !== 'Active') return false;

      // Match by parent email
      if (userEmail) {
        const emails = [
          s.email,
          (s as any).parentEmail,
          (s as any).fatherEmail,
          (s as any).motherEmail,
          (s as any).guardianEmail,
          (s as any).contactEmail
        ].map(e => (e || '').toLowerCase().trim()).filter(Boolean);

        if (emails.includes(userEmail)) return true;
      }

      // Match by parent phone
      if (userPhone && userPhone.length >= 7) {
        const phones = [
          s.fatherPhone,
          s.motherPhone,
          (s as any).parentPhone,
          s.phone,
          (s as any).mobileNumber
        ].map(p => (p || '').replace(/\D/g, '')).filter(p => p.length >= 7);

        if (phones.some(p => p.endsWith(userPhone) || userPhone.endsWith(p))) return true;
      }

      // Match by exact parent full name
      if (userName && !isGenericUser) {
        const parentNames = [
          s.fatherName,
          s.motherName,
          (s as any).parentName,
          (s as any).guardianName
        ].map(n => (n || '').toLowerCase().trim()).filter(Boolean);

        for (const pName of parentNames) {
          if (pName === userName) return true;
          if (nameTokens.length >= 2 && nameTokens.every((token: string) => pName.includes(token))) return true;
        }
      }

      return false;
    }).map(s => ({
      id: String(s.id),
      studentId: s.id,
      admissionNo: s.admissionNo || `ADM-${s.id}`,
      rollNo: (s as any).rollNo || `ROLL-${s.id}`,
      firstName: s.firstName || ((s as any).studentName ? (s as any).studentName.split(' ')[0] : 'Student'),
      lastName: s.lastName || '',
      studentName: (s as any).studentName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
      className: s.className || '',
      section: s.section || '',
      gender: s.gender || 'Male',
      dob: s.dob || '',
      status: s.status || 'Active',
      fatherName: s.fatherName,
      motherName: s.motherName,
      studentType: (s as any).studentType || 'Day Scholar',
      bloodGroup: (s as any).bloodGroup,
      boardType: (s as any).boardType,
      casteCategory: (s as any).casteCategory,
      address: (s as any).address
    }));

    // 4. Fallback: From Admissions database matches (cross-referenced to real Student; ONLY if apiChildren is empty)
    const localAdmissionMatches: ParentWard[] = (admissions || []).filter(a => {
      const statusStr = String(a.status || '');
      if (statusStr === 'Rejected' || statusStr === 'Cancelled') return false;

      // Match by parent email
      if (userEmail) {
        const aEmail = ((a as any).parentEmail || a.email || '').toLowerCase().trim();
        if (aEmail && aEmail === userEmail) return true;
      }

      // Match by parent phone
      if (userPhone && userPhone.length >= 7) {
        const phones = [
          a.phone,
          (a as any).fatherMobileNo,
          (a as any).fatherContact,
          (a as any).alternateMobileNumber,
          (a as any).motherMobileNumber
        ].map(p => (p || '').replace(/\D/g, '')).filter(p => p.length >= 7);

        if (phones.some(p => p.endsWith(userPhone) || userPhone.endsWith(p))) return true;
      }

      // Match by exact parent full name
      if (userName && !isGenericUser) {
        const pNames = [(a as any).fatherFullName, a.parentName, (a as any).motherFullName, (a as any).motherName]
          .map(n => (n || '').toLowerCase().trim()).filter(Boolean);

        for (const pName of pNames) {
          if (pName === userName) return true;
          if (nameTokens.length >= 2 && nameTokens.every((token: string) => pName.includes(token))) return true;
        }
      }

      return false;
    }).map(a => {
      // Find matching student in students database strictly by Admission No, Roll No, or Student Name
      // CRITICAL FIX: NEVER match by String(st.id) === String(a.id) because admission ID and student ID are independent tables
      const matchedStudent = (students || []).find(st => {
        const stAdm = (st.admissionNo || (st as any).admissionNumber || '').trim().toLowerCase();
        const aAdm = (a.admissionNo || (a as any).applicationNo || (a as any).registrationNo || '').trim().toLowerCase();
        if (stAdm && aAdm && stAdm === aAdm) return true;

        const stRoll = String((st as any).rollNo || (st as any).rollNumber || '').trim().toLowerCase();
        const aRoll = String((a as any).registrationNo || (a as any).rollNo || '').trim().toLowerCase();
        if (stRoll && aRoll && stRoll === aRoll) return true;

        const stName = ((st as any).studentName || `${st.firstName || ''} ${st.lastName || ''}`).toLowerCase().trim().replace(/\s+/g, ' ');
        const aName = ((a as any).applicantFullName || (a as any).applicantName || `${(a as any).firstName || ''} ${(a as any).lastName || ''}`).toLowerCase().trim().replace(/\s+/g, ' ');
        if (stName && aName && stName === aName) return true;

        return false;
      });

      if (matchedStudent) {
        return {
          id: String(matchedStudent.id),
          studentId: matchedStudent.id,
          admissionNo: matchedStudent.admissionNo || a.admissionNo || (a as any).applicationNo || `ADM-${matchedStudent.id}`,
          rollNo: (matchedStudent as any).rollNo || (a as any).registrationNo || `ROLL-${matchedStudent.id}`,
          firstName: matchedStudent.firstName || ((matchedStudent as any).studentName ? (matchedStudent as any).studentName.split(' ')[0] : 'Student'),
          lastName: matchedStudent.lastName || '',
          studentName: (matchedStudent as any).studentName || `${matchedStudent.firstName || ''} ${matchedStudent.lastName || ''}`.trim() || 'Student',
          className: matchedStudent.className || (typeof a.appliedClass === 'string' ? a.appliedClass : (a.appliedClass as any)?.className) || '',
          section: matchedStudent.section || (a as any).section || '',
          gender: matchedStudent.gender || a.gender || 'Male',
          dob: matchedStudent.dob || (a as any).dateOfBirth || '',
          status: 'Active',
          fatherName: (matchedStudent as any).fatherName || (a as any).fatherFullName || a.parentName || '',
          motherName: (matchedStudent as any).motherName || (a as any).motherFullName || '',
          studentType: (matchedStudent as any).studentType || (a as any).studentType || 'Day Scholar',
          bloodGroup: (matchedStudent as any).bloodGroup || (a as any).bloodGroup,
          boardType: (matchedStudent as any).boardType || (a as any).boardType,
          casteCategory: (matchedStudent as any).casteCategory || (a as any).casteCategory || (a as any).caste,
          address: (matchedStudent as any).address || ((a as any).houseNo ? `${(a as any).houseNo} ${(a as any).street || ''} ${(a as any).areaLocality || ''} ${(a as any).city || ''}`.trim() : undefined)
        };
      }

      return {
        id: String(a.id),
        studentId: a.id,
        admissionNo: (a as any).applicationNo || (a as any).registrationNo || a.admissionNo || `ADM-${a.id}`,
        rollNo: (a as any).registrationNo || (a as any).applicationNo || `ROLL-${a.id}`,
        firstName: a.firstName || (a as any).applicantName?.split(' ')[0] || 'Student',
        lastName: a.lastName || (a as any).applicantName?.split(' ').slice(1).join(' ') || '',
        studentName: `${a.firstName || ''} ${a.lastName || ''}`.trim() || (a as any).applicantName || 'Student',
        className: (typeof a.appliedClass === 'string' ? a.appliedClass : (a.appliedClass as any)?.className) || a.className || '',
        section: (a as any).section || '',
        gender: a.gender || 'Male',
        dob: (a as any).dateOfBirth || (a as any).dob || '',
        status: 'Active',
        fatherName: (a as any).fatherFullName || a.parentName || '',
        motherName: (a as any).motherFullName || a.motherName || '',
        studentType: (a as any).studentType || 'Day Scholar',
        bloodGroup: (a as any).bloodGroup,
        boardType: (a as any).boardType,
        casteCategory: (a as any).casteCategory || (a as any).caste,
        address: (a as any).houseNo ? `${(a as any).houseNo} ${(a as any).street || ''} ${(a as any).areaLocality || ''} ${(a as any).city || ''}`.trim() : undefined
      };
    });

    // Authoritative selection:
    // When apiChildren has returned children from backend /api/parent/children, use mappedApi as primary.
    // Only if apiChildren is empty (e.g. offline / API not reachable), fallback to local matching.
    const sourceList = mappedApi.length > 0 
      ? mappedApi 
      : [...localStudentMatches, ...localAdmissionMatches];

    // Combine and deduplicate:
    // A child is the same if they share admissionNo, rollNo, studentId, or normalized studentName
    const mergedList: ParentWard[] = [];

    sourceList.forEach(incoming => {
      const inAdm = (incoming.admissionNo || '').trim().toLowerCase();
      const inRoll = (incoming.rollNo || '').trim().toLowerCase();
      const inId = String(incoming.studentId || incoming.id || '').trim().toLowerCase();
      const inName = (incoming.studentName || `${incoming.firstName || ''} ${incoming.lastName || ''}`)
        .trim().toLowerCase().replace(/\s+/g, ' ');

      const existingIdx = mergedList.findIndex(existing => {
        const exAdm = (existing.admissionNo || '').trim().toLowerCase();
        const exRoll = (existing.rollNo || '').trim().toLowerCase();
        const exId = String(existing.studentId || existing.id || '').trim().toLowerCase();
        const exName = (existing.studentName || `${existing.firstName || ''} ${existing.lastName || ''}`)
          .trim().toLowerCase().replace(/\s+/g, ' ');

        // 1. Same admission number
        if (inAdm && exAdm && inAdm === exAdm) return true;

        // 2. Same roll number / registration number
        if (inRoll && exRoll && inRoll === exRoll) return true;

        // 3. Same student ID
        if (inId && exId && inId === exId) return true;

        // 4. Same student name
        if (inName && exName && inName === exName) return true;

        return false;
      });

      if (existingIdx === -1) {
        mergedList.push({ ...incoming });
      } else {
        // Child already present; enrich any missing details from incoming
        const ex = mergedList[existingIdx];
        if (!ex.bloodGroup && incoming.bloodGroup) ex.bloodGroup = incoming.bloodGroup;
        if (!ex.boardType && incoming.boardType) ex.boardType = incoming.boardType;
        if (!ex.studentType && incoming.studentType) ex.studentType = incoming.studentType;
        if (!ex.casteCategory && incoming.casteCategory) ex.casteCategory = incoming.casteCategory;
        if (!ex.dob && incoming.dob) ex.dob = incoming.dob;
        if (!ex.className && incoming.className) ex.className = incoming.className;
        if (!ex.section && incoming.section) ex.section = incoming.section;
        if (!ex.fatherName && incoming.fatherName) ex.fatherName = incoming.fatherName;
        if (!ex.motherName && incoming.motherName) ex.motherName = incoming.motherName;
        if (!ex.address && incoming.address) ex.address = incoming.address;
      }
    });

    const result = mergedList;

        // STRICT: Return only the matched children for this parent.
    // Never fallback to arbitrary students (students.slice(0, 4)), preventing data leaks.
    return result;
  }, [students, admissions, apiChildren, user?.email, user?.phone, (user as any)?.mobileNumber, user?.name, (user as any)?.fullName, user?.id, user?.role, role]);

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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              isSelected
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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
