import React, { useMemo } from 'react';
import { Download, Printer, X, Shield, Phone, MapPin, Building, Heart, User, CheckCircle, Mail, Globe } from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import { formatToDDMMYYYY } from '../../../utils/dateValidation';

interface PrintableIDCardProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableIDCard: React.FC<PrintableIDCardProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const { schoolProfile, admissions, studentTransports, students } = useData();

  const liveStudent = useMemo(() => {
    if (!student) return student;
    const found = (students || []).find(s => s.id === student.id || (student.admissionNo && s.admissionNo === student.admissionNo));
    return found || student;
  }, [students, student]);

  const matchingAdmission = useMemo(() => {
    if (!liveStudent) return null;
    return (admissions || []).find(a =>
      (a.admissionNo && a.admissionNo === liveStudent.admissionNo) ||
      (a.applicationNo && (a.applicationNo === liveStudent.admissionNo || (liveStudent as any).applicationNo === a.applicationNo)) ||
      (a.applicantName && `${liveStudent.firstName} ${liveStudent.lastName}`.trim().toLowerCase() === a.applicantName.trim().toLowerCase())
    ) || null;
  }, [admissions, liveStudent]);

  const transportAllocation = useMemo(() => {
    if (!liveStudent) return null;
    return (studentTransports || []).find(t =>
      t.studentId === liveStudent.id ||
      (liveStudent.admissionNo && t.admissionNo === liveStudent.admissionNo) ||
      (t.studentName && `${liveStudent.firstName} ${liveStudent.lastName}`.trim().toLowerCase() === t.studentName.trim().toLowerCase())
    ) || null;
  }, [studentTransports, liveStudent]);

  if (!isOpen || !liveStudent) return null;

  const studentPhoto = resolveMediaUrl(liveStudent.avatar || matchingAdmission?.avatar || '');

  const isHosteller =
    liveStudent.studentType === 'Hosteller' ||
    liveStudent.studentType === 'Residential' ||
    matchingAdmission?.studentType === 'Hosteller' ||
    matchingAdmission?.studentType === 'Residential';

  const assignedRouteName =
    transportAllocation?.routeName ||
    liveStudent.busRoute ||
    matchingAdmission?.busRoute ||
    'Not Assigned';

  const assignedPickupPoint =
    transportAllocation?.pickupPoint ||
    liveStudent.pickupPoint ||
    matchingAdmission?.pickupPoint ||
    'Not Assigned';

  const academicSession = (liveStudent as any).academicYear || schoolProfile?.academicYear || '2025-2026';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const renderBarcode = (val: string) => {
    const clean = (val || 'STU-000').toUpperCase();
    const bars = [];
    let x = 4;
    for (let i = 0; i < clean.length; i++) {
      const c = clean.charCodeAt(i);
      const w1 = (c % 3) + 1;
      const w2 = ((c >> 1) % 2) + 1;
      bars.push(<rect key={`b1-${i}`} x={x} y="0" width={w1} height="22" fill="currentColor" />);
      x += w1 + 1.5;
      bars.push(<rect key={`b2-${i}`} x={x} y="0" width={w2} height="22" fill="currentColor" />);
      x += w2 + 2;
    }
    return (
      <div className="flex flex-col items-center">
        <svg viewBox={`0 0 ${Math.max(x + 4, 110)} 22`} className="h-5 w-28 text-slate-800 dark:text-slate-100 print:text-black">
          {bars}
        </svg>
        <span className="font-mono text-[7.5px] tracking-widest text-slate-500 font-bold print:text-black">{clean}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto print:shadow-none print:border-none print:max-w-none print:w-full print:p-4 print:overflow-visible">
        {/* Controls Bar (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Official Student Identity Card (Front & Back)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Both Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center items-start print:grid-cols-2 print:gap-4 print:m-0">
          
          {/* FRONT SIDE */}
          <div className="w-full max-w-[310px] mx-auto rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col font-sans print:shadow-none print:border print:border-slate-400 print:bg-white print:text-black">
            {/* Header */}
            <div className="p-3.5 bg-gradient-to-r from-brand-700 via-sky-700 to-sky-800 text-white relative text-center print:bg-brand-700 print:text-white">
              <div className="flex items-center justify-center gap-2.5">
                {schoolProfile?.logoUrl ? (
                  <img
                    src={resolveMediaUrl(schoolProfile.logoUrl)}
                    alt="School Logo"
                    className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-sm ring-1 ring-white/30 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white text-brand-700 font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                    {schoolProfile?.name ? schoolProfile.name.slice(0, 2).toUpperCase() : 'PS'}
                  </div>
                )}
                <div className="text-left overflow-hidden">
                  <h4 className="font-black text-xs uppercase tracking-wider leading-tight text-white truncate max-w-[200px]">
                    {schoolProfile?.name || 'School Name'}
                  </h4>
                  <p className="text-[9px] text-sky-200 font-medium truncate max-w-[200px]">
                    {liveStudent.branch || matchingAdmission?.branch ? `${liveStudent.branch || matchingAdmission?.branch} Campus` : (schoolProfile?.tagline || 'Empowering Minds, Shaping Tomorrow')}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 py-1 px-3 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-between text-[9px] font-black tracking-wider uppercase text-white/95 border border-white/20 print:border-white">
                <span>STUDENT IDENTITY CARD</span>
                <span className="font-mono text-amber-300 print:text-amber-200">{academicSession}</span>
              </div>
            </div>

            {/* Photo & Info */}
            <div className="p-4 flex flex-col items-center flex-1 space-y-3">
              <div className="w-24 h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-brand-500 shadow-md flex items-center justify-center shrink-0 print:border-slate-400">
                {studentPhoto ? (
                  <img
                    src={studentPhoto}
                    alt={`${liveStudent.firstName} ${liveStudent.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <User className="w-10 h-10 text-slate-400 mb-1" />
                    <span className="text-[9px] font-bold">No Photo</span>
                  </div>
                )}
              </div>

              <div className="text-center space-y-1 w-full">
                <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight print:text-black">
                  {liveStudent.firstName} {liveStudent.lastName}
                </h3>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-[10px] font-extrabold border border-brand-200 dark:border-brand-800 print:bg-slate-100 print:text-black print:border-slate-300">
                    Class: {liveStudent.className}-{liveStudent.section}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold print:bg-slate-100 print:text-black">
                    Roll #{liveStudent.rollNo}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[10px] print:bg-slate-50 print:border-slate-200 print:text-black">
                <div>
                  <span className="text-slate-400 font-medium block print:text-slate-600">Admission No:</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white print:text-black">{liveStudent.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block print:text-slate-600">Date of Birth:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">{formatToDDMMYYYY(liveStudent.dob || matchingAdmission?.dob || '', '-')}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block print:text-slate-600">Blood Group:</span>
                  <span className="font-black text-rose-500 flex items-center gap-1 print:text-rose-700">
                    <Heart className="w-2.5 h-2.5 fill-rose-500 print:fill-rose-700" />
                    {liveStudent.bloodGroup || matchingAdmission?.bloodGroup || 'Not Specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block print:text-slate-600">Emergency Contact:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 print:text-black">
                    {liveStudent.fatherPhone || matchingAdmission?.phone || liveStudent.phone || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="w-full flex items-end justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 print:border-slate-300">
                <div className="shrink-0">
                  {renderBarcode(liveStudent.admissionNo)}
                </div>
                <div className="text-right">
                  <div className="h-5 flex items-end justify-end">
                    <span className="font-serif italic text-[11px] font-bold text-brand-700 dark:text-brand-300 print:text-black">
                      {schoolProfile?.principalName || 'Principal'}
                    </span>
                  </div>
                  <p className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-300 dark:border-slate-700 pt-0.5 print:text-slate-600">
                    Authorized Signatory
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="w-full max-w-[310px] mx-auto rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col font-sans print:shadow-none print:border print:border-slate-400 print:bg-white print:text-black">
            <div className="p-3 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 text-white text-center border-b border-slate-700 print:bg-slate-800 print:text-white">
              <h4 className="font-black text-[11px] uppercase tracking-wider text-amber-300 print:text-amber-200">
                PARENT & GUARDIAN DETAILS
              </h4>
              <p className="text-[9px] text-slate-300 print:text-slate-200">{schoolProfile?.name || 'School Student Record'}</p>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-[10px]">
              <div className="space-y-2.5">
                {/* Parents Grid */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 print:border-slate-200">
                    <div>
                      <span className="text-[9px] font-black uppercase text-brand-600 dark:text-brand-400 block print:text-brand-700">Father's Name</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs print:text-black">
                        {liveStudent.fatherName || matchingAdmission?.parentName || 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 block print:text-slate-500">Mobile</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 print:text-black">
                        {liveStudent.fatherPhone || matchingAdmission?.phone || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <div>
                      <span className="text-[9px] font-black uppercase text-sky-600 dark:text-sky-400 block print:text-sky-700">Mother's Name</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs print:text-black">
                        {liveStudent.motherName || matchingAdmission?.motherName || 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 block print:text-slate-500">Mobile</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 print:text-black">
                        {liveStudent.motherPhone || matchingAdmission?.motherPhone || liveStudent.alternatePhone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Residential Address */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1 print:text-slate-600">
                    <MapPin className="w-3 h-3 text-brand-600 print:text-brand-700" /> Residential Address
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-[10px] leading-relaxed print:text-black">
                    {liveStudent.address || matchingAdmission?.address || 'Address not specified'}
                  </p>
                </div>

                {/* Transport or Hostel */}
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] print:bg-slate-50 print:border-slate-200">
                  {isHosteller ? (
                    <>
                      <span className="font-semibold text-slate-500 print:text-slate-600">Hostel Allocation:</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400 print:text-brand-700">
                        {liveStudent.hostelBlock || matchingAdmission?.hostelBlock ? `${liveStudent.hostelBlock || matchingAdmission?.hostelBlock} ${liveStudent.hostelRoom ? `(Rm ${liveStudent.hostelRoom})` : ''}` : 'Hostel Resident'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-slate-500 print:text-slate-600">Transport / Route:</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[170px] print:text-black">
                        {assignedRouteName !== 'None' && assignedRouteName !== 'N/A'
                          ? `${assignedRouteName} (${assignedPickupPoint})`
                          : 'Self Transport'}
                      </span>
                    </>
                  )}
                </div>

                {/* Instructions */}
                <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-[8.5px] text-amber-900 dark:text-amber-200/90 leading-tight space-y-0.5 print:bg-slate-50 print:border-slate-300 print:text-black">
                  <p className="font-bold">Instructions:</p>
                  <p>1. This card must be carried daily and presented on demand.</p>
                  <p>2. If lost or found, please return immediately to the school office.</p>
                </div>
              </div>

              {/* School Verification Footer */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[8.5px] text-slate-500 text-center space-y-0.5 print:border-slate-300 print:text-black">
                <p className="font-bold text-slate-700 dark:text-slate-300 print:text-black">{schoolProfile?.address || 'School Campus'}</p>
                <p className="font-mono print:text-black">
                  Ph: {schoolProfile?.phone || liveStudent.phone} • Email: {schoolProfile?.email || 'office@school.edu'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons (hidden in print) */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 hover:bg-brand-100 rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Cards (PDF)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Both Sides
          </button>
        </div>
      </div>
    </div>
  );
};
