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
      const userEmail = (user?.email || '').toLowerCase().trim();
      const userPhone = (user?.phone || (user as any)?.mobileNumber || '').replace(/\D/g, '');

      const matched = (students || []).find(s => {
        if (!s) return false;
        const sId = String(s.id || '').trim().toLowerCase();
        const sAdm = String(s.admissionNo || (s as any).admissionNumber || '').trim().toLowerCase();
        const sRoll = String((s as any).rollNo || (s as any).rollNumber || '').trim().toLowerCase();
        const sEmail = (s.email || '').trim().toLowerCase();

        if (userId && (sId === userId || sAdm === userId || sRoll === userId)) return true;
        if (userEmail && sEmail === userEmail) return true;
        if (userPhone && userPhone.length >= 7) {
          const sPhone = (s.phone || (s as any).mobileNumber || '').replace(/\D/g, '');
          if (sPhone && (sPhone.endsWith(userPhone) || userPhone.endsWith(sPhone))) return true;
        }
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

      return [];
    }

    // 2. Authoritative parent ward list from backend /api/parent/children
    if (!apiChildren || apiChildren.length === 0) {
      return [];
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
