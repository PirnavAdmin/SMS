import React, { useState, useMemo } from 'react';
import { Building2, Home, MapPin, BedDouble, UserCircle, Phone } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useParentWards, ParentStudentSelector } from '../../common/ParentStudentSelector';

export const ParentHostelView: React.FC = () => {
  const { studentHostels = [], hostelMasters = [], admissions = [] } = useData();
  const parentWards = useParentWards();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  
  // Find hostel assignment
  const hostelAssignment = studentHostels.find(h => 
    (String(h.studentId) === String(currentWard?.id) || 
     String(h.studentId) === String(currentWard?.studentId) || 
     (h.admissionNo && currentWard?.admissionNo && String(h.admissionNo).toLowerCase() === String(currentWard.admissionNo).toLowerCase())) && 
    (h.status === 'Active' || h.status === 'Occupied')
  );

  const fallbackHostel = useMemo(() => {
    if (!currentWard) return null;
    if (currentWard.hostelBlock || currentWard.hostelRoom || currentWard.hostelBed) {
      return {
        hostelName: currentWard.hostelBlock || '',
        roomNo: currentWard.hostelRoom || '-',
        bedNo: currentWard.hostelBed || '-',
      };
    }
    const wAdm = String(currentWard.admissionNo || '').trim().toLowerCase();
    const wId = String(currentWard.studentId || currentWard.id || '').trim().toLowerCase();
    const adm = (admissions || []).find((a: any) => 
      (wAdm && String(a.admissionNo || a.admissionNumber || '').toLowerCase() === wAdm) || 
      (wId && String(a.id || '').toLowerCase() === wId)
    );
    if (adm && (adm.hostelBlock || adm.hostelRoom || (adm as any).availableBed || (adm as any).hostelBed)) {
      return {
        hostelName: adm.hostelBlock || '',
        roomNo: adm.hostelRoom || '-',
        bedNo: (adm as any).availableBed || (adm as any).hostelBed || '-',
      };
    }
    return null;
  }, [currentWard, admissions]);

  const activeHostelAssignment = hostelAssignment || fallbackHostel;
  
  // Retrieve additional details if assignment is found
  const hostelMaster = activeHostelAssignment ? hostelMasters.find(hm => 
    (activeHostelAssignment as any).hostelId ? hm.id === (activeHostelAssignment as any).hostelId : (hm.hostelName === activeHostelAssignment.hostelName)
  ) : null;

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active wards found in the system.
      </div>
    );
  }

  const isHostelTypeString = (val?: string) => {
    const clean = String(val || '').toLowerCase().trim();
    if (!clean) return false;
    if (clean.includes('non') || clean.includes('day scholar') || clean.includes('dayscholar') || clean.includes('day-scholar')) return false;
    return clean === 'residential' || clean === 'hosteller' || clean === 'hostel' || clean.includes('hostel');
  };

  const isResidential = 
    Boolean(activeHostelAssignment?.hostelName && activeHostelAssignment.hostelName !== 'N/A') ||
    isHostelTypeString(currentWard?.studentType);

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
      <ParentStudentSelector
        wards={parentWards}
        selectedIndex={selectedChildIdx}
        onSelect={setSelectedChildIdx}
      />
      
      {!isResidential ? (
        <div className="w-full bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-sky-300 dark:border-sky-800 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-2xs">
            <Home className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Non-Residential Student (Day Scholar)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">{currentWard.firstName} {currentWard.lastName}</strong> is registered as a Day Scholar and is not assigned to campus residential or hostel facilities. If you require campus boarding or room allocation, please contact the School Administrative Office or Hostel Warden desk.
            </p>
          </div>
        </div>
      ) : activeHostelAssignment ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allocation Details */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sky-300 dark:border-sky-800 shadow-sm space-y-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <BedDouble className="w-5 h-5 text-sky-500" /> Room Allocation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hostel Name</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">{activeHostelAssignment.hostelName}</p>
                  {hostelMaster?.hostelType && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-full font-bold">
                      {hostelMaster.hostelType} Hostel
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Room & Bed details</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">
                    Room {activeHostelAssignment.roomNo} <span className="text-slate-300 dark:text-slate-600 mx-2">|</span> Bed {activeHostelAssignment.bedNo}
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
        <div className="w-full bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-sky-300 dark:border-sky-800 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto shadow-2xs">
            <BedDouble className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Hostel Allocation In Progress
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">{currentWard.firstName} {currentWard.lastName}</strong> is registered as a Residential student. Hostel block and room allocation are currently being processed. For room allocation queries, please contact the Chief Hostel Warden or Administration office.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
