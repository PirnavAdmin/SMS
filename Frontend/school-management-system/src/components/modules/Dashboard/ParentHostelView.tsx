import React, { useState, useEffect, useMemo } from 'react';
import { Building2, AlertCircle, Home, MapPin, BedDouble, UserCircle, Phone } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getParentChildren, ParentChild } from '../../../api/parent/parentApi';

export const ParentHostelView: React.FC = () => {
  const { students = [], admissions = [], studentHostels = [], hostelMasters = [] } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      try {
        const children = await getParentChildren(user?.email);
        if (isMounted) {
          setApiChildren(children || []);
        }
      } catch (err) {
        console.warn('Failed to load parent children in hostel view:', err);
      }
    };
    fetchChildren();
    return () => { isMounted = false; };
  }, [user?.email]);

  const parentWards = useMemo(() => {
    if (apiChildren.length > 0) {
      return apiChildren.map(c => ({
        id: String(c.studentId),
        studentId: c.studentId,
        firstName: c.firstName || c.studentName.split(' ')[0],
        lastName: c.lastName || '',
        studentName: c.studentName || 'Student',
        className: c.className || '',
        section: c.sectionName || '',
        status: 'Active'
      }));
    }

    const userEmail = (user?.email || '').toLowerCase().trim();
    const userPhone = (user?.phone || '').replace(/\D/g, '');

    const studentMatches = (students || []).filter(s => 
      s.status === 'Active' && 
      (
        role === 'Student' ? (s.id === user?.id || s.email === user?.email) : 
        (
          (userEmail && (
            (s.email && s.email.toLowerCase().trim() === userEmail) ||
            ((s as any).parentEmail && (s as any).parentEmail.toLowerCase().trim() === userEmail) ||
            s.guardianEmail?.toLowerCase() === userEmail || 
            s.contactEmail?.toLowerCase() === userEmail || 
            s.fatherPhone?.toLowerCase() === userEmail ||
            s.motherPhone?.toLowerCase() === userEmail
          )) ||
          (userPhone && userPhone.length >= 7 && (
            (s.fatherPhone && s.fatherPhone.replace(/\D/g, '').endsWith(userPhone)) ||
            (s.motherPhone && s.motherPhone.replace(/\D/g, '').endsWith(userPhone))
          ))
        )
      )
    );

    const admissionMatches = (admissions || []).filter(a => {
      if ((a.status as any) === 'Rejected' || (a.status as any) === 'Cancelled') return false;
      const phoneMatch = userPhone && userPhone.length >= 7 && (
        (a.phone && a.phone.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).fatherMobileNo && (a as any).fatherMobileNo.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).fatherContact && (a as any).fatherContact.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).alternateMobileNumber && (a as any).alternateMobileNumber.replace(/\D/g, '').endsWith(userPhone))
      );
      const emailMatch = userEmail && (
        (a.email && a.email.toLowerCase().trim() === userEmail) ||
        ((a as any).parentEmail && (a as any).parentEmail.toLowerCase().trim() === userEmail)
      );
      return phoneMatch || emailMatch;
    }).map(a => ({
      id: String(a.id),
      studentId: a.id,
      firstName: a.firstName || (a as any).applicantName?.split(' ')[0] || 'Student',
      lastName: a.lastName || '',
      studentName: `${a.firstName || ''} ${a.lastName || ''}`.trim() || (a as any).applicantName || 'Student',
      className: (a as any).appliedClass?.className || (a as any).className || (typeof a.appliedClass === 'string' ? a.appliedClass : '') || '',
      section: (a as any).section || '',
      status: 'Active'
    }));

    const combined = [...studentMatches, ...admissionMatches];
    const unique = new Map();
    combined.forEach(w => {
      const sName = ((w as any).studentName || `${(w as any).firstName || ''} ${(w as any).lastName || ''}`).trim().toLowerCase();
      const cName = ((w as any).className || '').toString().toLowerCase().replace(/class/gi, '').trim();
      const key = `${sName}_${cName}`;
      if (sName && !unique.has(key)) {
        unique.set(key, w);
      }
    });
    return Array.from(unique.values());
  }, [students, admissions, user, role, apiChildren]);

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active wards found in the system.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  
  // Find hostel assignment
  const hostelAssignment = studentHostels.find(h => h.studentId === currentWard.id && h.status === 'Active');
  
  // Retrieve additional details if assignment is found
  const hostelMaster = hostelAssignment ? hostelMasters.find(hm => hm.id === hostelAssignment.hostelId || hm.hostelName === hostelAssignment.hostelName) : null;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <Building2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          Hostel Accommodation
        </h2>
      </div>



      {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
      {role !== 'Student' && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedChildIdx === idx
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}
      
      {currentWard.studentType === 'Day Scholar' || currentWard.studentType === 'Non-Residential' ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-2xl mx-auto mt-10">
          <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Non-Residential</h3>
          <p className="text-slate-500 text-sm">
            {currentWard.firstName} is registered as a Non-Residential student and is not assigned to any campus residential facilities.
          </p>
        </div>
      ) : hostelAssignment ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allocation Details */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <BedDouble className="w-5 h-5 text-sky-500" /> Room Allocation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hostel Name</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">{hostelAssignment.hostelName}</p>
                  {hostelMaster?.hostelType && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full font-bold">
                      {hostelMaster.hostelType} Hostel
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Room & Bed details</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">
                    Room {hostelAssignment.roomNo} <span className="text-slate-300 mx-2">|</span> Bed {hostelAssignment.bedNo}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warden Details */}
          {hostelMaster && (
            <div className="bg-gradient-to-br from-sky-500 to-violet-600 p-6 rounded-3xl border border-sky-400 shadow-sm text-white space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2 border-b border-sky-400/50 pb-3">
                <UserCircle className="w-5 h-5 text-sky-100" /> Warden Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sky-200 text-xs font-bold uppercase tracking-wider mb-1">Chief Warden</p>
                  <p className="text-xl font-bold">{hostelMaster.wardenName}</p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                  <p className="text-sky-200 text-xs font-bold uppercase tracking-wider mb-2">Emergency Contact</p>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-sky-200" />
                    <p className="font-bold text-lg">{hostelMaster.wardenMobile}</p>
                  </div>
                  {hostelMaster.wardenAlternateMobile && (
                    <div className="flex items-center gap-3 mt-2 text-sky-100">
                      <Phone className="w-4 h-4 opacity-50" />
                      <p className="font-medium text-sm">{hostelMaster.wardenAlternateMobile}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-2xl mx-auto mt-10">
          <BedDouble className="w-16 h-16 text-sky-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Residential Allocation Processing</h3>
          <p className="text-slate-500 text-sm">
            {currentWard.firstName} is registered as a Residential student, but specific room and bed allocation has not been finalized yet. Please contact the administration.
          </p>
        </div>
      )}
    </div>
  );
};
