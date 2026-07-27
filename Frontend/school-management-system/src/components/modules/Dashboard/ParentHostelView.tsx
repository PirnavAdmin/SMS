import React, { useState } from 'react';
import { Building2, AlertCircle, Home, MapPin, BedDouble, UserCircle, Phone } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const ParentHostelView: React.FC = () => {
  const { students, studentHostels, hostelMasters } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  // Match children by email or phone, or own ID if student
  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (
      role === 'Student' ? s.id === user?.id : 
      (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
    )
  );

  const hasMatchedWards = parentWards.length > 0;
  if (!hasMatchedWards) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
  }

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
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-500" /> Hostel Accommodation
        </h2>
        <p className="text-xs text-slate-500 mt-1">Review hostel allocation and warden contact details</p>
      </div>

      {!hasMatchedWards && (
         <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
               <p className="font-bold">Demo Mode Active</p>
               <p>Your login ({user?.email}) did not match any records in the database. Showing sample wards for demonstration.</p>
            </div>
         </div>
      )}

      {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
      {role !== 'Student' && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedChildIdx === idx
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {currentWard.studentType === 'Day Scholar' ? (
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
              <BedDouble className="w-5 h-5 text-indigo-500" /> Room Allocation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hostel Name</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">{hostelAssignment.hostelName}</p>
                  {hostelMaster?.hostelType && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold">
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
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-6 rounded-3xl border border-indigo-400 shadow-sm text-white space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2 border-b border-indigo-400/50 pb-3">
                <UserCircle className="w-5 h-5 text-indigo-100" /> Warden Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Chief Warden</p>
                  <p className="text-xl font-bold">{hostelMaster.wardenName}</p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Emergency Contact</p>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-indigo-200" />
                    <p className="font-bold text-lg">{hostelMaster.wardenMobile}</p>
                  </div>
                  {hostelMaster.wardenAlternateMobile && (
                    <div className="flex items-center gap-3 mt-2 text-indigo-100">
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
          <BedDouble className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Residential Allocation Processing</h3>
          <p className="text-slate-500 text-sm">
            {currentWard.firstName} is registered as a Residential student, but specific room and bed allocation has not been finalized yet. Please contact the administration.
          </p>
        </div>
      )}
    </div>
  );
};
