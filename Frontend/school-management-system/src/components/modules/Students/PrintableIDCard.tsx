import React from 'react';
import { Download, Printer, X, Shield, Phone, MapPin, Building } from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';

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
  const { schoolProfile } = useData();

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Triggers standard window print which allows "Save as PDF"
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 print:shadow-none print:border-none print:max-w-none print:w-full print:p-0">
        {/* Controls Bar (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" /> Student Identity Card
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable ID Card Container */}
        <div className="flex justify-center my-2">
          <div className="w-80 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white p-5 shadow-2xl border border-slate-700/80 space-y-4 relative overflow-hidden font-sans print:w-[3.375in] print:h-[5.375in] print:rounded-none print:shadow-none print:border print:border-slate-300 print:text-black print:bg-white">
            {/* Holographic accent stripe */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-brand-500 via-indigo-500 to-amber-400" />

            {/* School Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <img
                src={schoolProfile.logoUrl}
                alt=""
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-500/30 shrink-0"
              />
              <div className="truncate">
                <h4 className="font-black text-xs uppercase tracking-wider text-white truncate print:text-slate-900">
                  {schoolProfile.name}
                </h4>
                <p className="text-[9px] text-brand-300 font-medium truncate print:text-slate-600">
                  {schoolProfile.tagline}
                </p>
              </div>
            </div>

            {/* Student Photo & Primary Info */}
            <div className="flex items-center gap-4 pt-1">
              <img
                src={student.avatar}
                alt={student.firstName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-brand-500/40 shadow-xl shrink-0"
              />
              <div className="space-y-1 overflow-hidden">
                <h3 className="font-extrabold text-base text-white truncate print:text-slate-900">
                  {student.firstName} {student.lastName}
                </h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold border border-brand-500/30 print:bg-slate-100 print:text-slate-800">
                  Class: {student.className}-{student.section}
                </span>
                <p className="text-[10px] font-mono text-slate-300 print:text-slate-600">
                  Adm No: <strong className="text-white print:text-slate-900">{student.admissionNo}</strong>
                </p>
              </div>
            </div>

            {/* Grid Attributes */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[10px] print:bg-slate-50 print:border-slate-200 print:text-slate-800">
              <div>
                <span className="text-slate-400 block print:text-slate-500">Date of Birth:</span>
                <span className="font-bold text-white print:text-slate-900">{student.dob}</span>
              </div>
              <div>
                <span className="text-slate-400 block print:text-slate-500">Blood Group:</span>
                <span className="font-bold text-rose-400 print:text-rose-600">{student.bloodGroup}</span>
              </div>
              <div>
                <span className="text-slate-400 block print:text-slate-500">Father Phone:</span>
                <span className="font-bold text-emerald-400 print:text-emerald-700">{student.fatherPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block print:text-slate-500">Branch:</span>
                <span className="font-bold text-amber-300 print:text-amber-800">{student.branch || 'Main Campus'}</span>
              </div>
            </div>

            {/* School Address Footer */}
            <div className="pt-2 border-t border-slate-800/80 text-[9px] text-slate-400 space-y-0.5 text-center print:text-slate-600">
              <p className="font-bold text-slate-300 print:text-slate-800 flex items-center justify-center gap-1">
                <Building className="w-3 h-3 text-brand-400" /> {schoolProfile.name}
              </p>
              <p className="truncate flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" /> {schoolProfile.address}
              </p>
              <p className="flex items-center justify-center gap-1 font-mono text-slate-300 print:text-slate-700">
                <Phone className="w-3 h-3 text-slate-500" /> Contact: {schoolProfile.phone}
              </p>
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
            <Download className="w-4 h-4" /> Download ID Card (PDF)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print ID Card
          </button>
        </div>
      </div>
    </div>
  );
};
