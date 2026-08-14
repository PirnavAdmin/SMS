import React from 'react';
import { CertificateTemplateConfig, SchoolProfile } from '../../../types';
import { formatDateDDMMYYYY } from '../../../utils/dateValidation';

export interface PrintableCertificateContainerProps {
  template: CertificateTemplateConfig;
  schoolProfile: SchoolProfile;
  academicYear: string;
  studentName: string;
  admissionNo: string;
  admissionDate: string;
  fatherName: string;
  motherName: string;
  dob: string;
  dobInWords?: string;
  gender: string;
  className: string;
  section: string;
  rollNo: string;
  leavingDate: string;
  reason: string;
  conduct: string;
  remarks: string;
  result: string;
  feeClearanceStatus: string;
  tcNo: string;
  issueDate: string;
  isDraftPreview?: boolean;
}

export const PrintableCertificateContainer: React.FC<PrintableCertificateContainerProps> = ({
  template,
  schoolProfile,
  academicYear,
  studentName,
  admissionNo,
  admissionDate,
  fatherName,
  motherName,
  dob,
  dobInWords,
  gender,
  className,
  section,
  rollNo,
  leavingDate,
  reason,
  conduct,
  remarks,
  result,
  feeClearanceStatus,
  tcNo,
  issueDate,
  isDraftPreview = false
}) => {
  const themeColor = template.themeColor || '#1e3a8a';
  const schoolName = schoolProfile.name || "Pirnav Educational Institutions";
  const schoolAddress = schoolProfile.address || "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081";
  const schoolPhone = schoolProfile.phone || "+91 9123456789";
  const schoolEmail = schoolProfile.email || "contact@pirnavschools.edu";
  const schoolLogoUrl = schoolProfile.logoUrl;

  // Header Style Variations
  const getContainerStyle = () => {
    switch (template.headerStyle) {
      case 'Modern Minimalist':
        return {
          border: `2px solid ${themeColor}`,
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        };
      case 'Royal Gold Crest':
        return {
          border: `3px solid ${themeColor}`,
          outline: '3px double #d97706',
          outlineOffset: '-10px',
          borderRadius: '4px'
        };
      case 'Executive Slate':
        return {
          border: '4px solid #334155',
          borderRadius: '8px'
        };
      case 'Classic Double Border':
      default:
        return {
          border: `8px double ${themeColor}`,
          borderRadius: '8px'
        };
    }
  };

  return (
    <div
      className="bg-white text-slate-900 p-8 sm:p-10 font-serif relative max-w-4xl mx-auto shadow-2xl space-y-6"
      style={getContainerStyle()}
    >
      {/* Top Accent Bar for Modern Minimalist */}
      {template.headerStyle === 'Modern Minimalist' && (
        <div
          className="h-2 -mx-8 sm:-mx-10 -mt-8 sm:-mt-10 mb-6 rounded-t-xl"
          style={{ backgroundColor: themeColor }}
        />
      )}

      {/* DRAFT WATERMARK IF PREVIEW ONLY */}
      {isDraftPreview && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none">
          <span className="text-7xl font-black font-sans uppercase tracking-widest text-slate-900 rotate-[-25deg]">
            OFFICIAL PREVIEW
          </span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className={`text-center space-y-2 pb-4 ${
        template.headerStyle === 'Executive Slate'
          ? 'bg-slate-800 text-white -mx-8 sm:-mx-10 -mt-8 sm:-mt-10 p-6 rounded-t-sm mb-4'
          : 'border-b-2'
      }`} style={template.headerStyle !== 'Executive Slate' ? { borderColor: themeColor } : undefined}>

        {/* LOGO & SCHOOL BRANDING */}
        <div className="flex items-center justify-center gap-4">
          {template.showLogo && (
            schoolLogoUrl ? (
              <img
                src={schoolLogoUrl}
                alt="School Logo"
                className="w-14 h-14 object-contain shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl shrink-0"
                style={{ backgroundColor: themeColor }}
              >
                {schoolName[0]}
              </div>
            )
          )}
          <div className="text-center">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-wide uppercase font-sans ${
              template.headerStyle === 'Executive Slate' ? 'text-white' : 'text-slate-900'
            }`}>
              {schoolName}
            </h1>
            <p className={`text-xs font-sans mt-0.5 ${
              template.headerStyle === 'Executive Slate' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {schoolAddress} • Ph: {schoolPhone} • Email: {schoolEmail}
            </p>
            {template.subTitle && (
              <p className={`text-[11px] font-sans font-bold mt-1 ${
                template.headerStyle === 'Executive Slate' ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {template.subTitle}
              </p>
            )}
          </div>
        </div>

        {/* CERTIFICATE TITLE BADGE */}
        <div className="pt-2">
          <span
            className="px-6 py-1 rounded-full text-white text-xs sm:text-sm font-black tracking-widest uppercase font-sans inline-block shadow-md"
            style={{ backgroundColor: themeColor }}
          >
            {template.title || 'OFFICIAL TRANSFER CERTIFICATE'}
          </span>
        </div>

        {/* METADATA BADGE BAR */}
        <div className={`flex flex-wrap items-center justify-between text-xs font-sans pt-2 px-2 border-t border-slate-200/60 mt-3 ${
          template.headerStyle === 'Executive Slate' ? 'text-slate-300 border-slate-700' : 'text-slate-600'
        }`}>
          <div>TC No: <strong className="font-mono text-slate-900 dark:text-white font-bold">{tcNo}</strong></div>
          <div>Academic Session: <strong className="font-mono text-slate-900 dark:text-white font-bold">{academicYear}</strong></div>
          <div>Issue Date: <strong className="font-mono text-slate-900 dark:text-white font-bold">{formatDateDDMMYYYY(issueDate)}</strong></div>
          <div>Adm No: <strong className="font-mono text-slate-900 dark:text-white font-bold">{admissionNo}</strong></div>
        </div>
      </div>

      {/* CUSTOM PREAMBLE (IF CONFIGURED) */}
      {template.customPreamble && template.customPreamble.trim() !== '' && (
        <div className="py-2 px-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <p className="text-xs sm:text-sm italic font-serif text-slate-700 leading-relaxed">
            "{template.customPreamble}"
          </p>
        </div>
      )}

      {/* CERTIFICATE DATA TABLE */}
      <table className="w-full text-xs sm:text-sm border-collapse font-sans">
        <tbody>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500 w-1/2">1. Name of Student:</td>
            <td className="py-2.5 px-3 font-black text-slate-900 uppercase text-sm">{studentName}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">2. Father's / Guardian's Name:</td>
            <td className="py-2.5 px-3 font-bold text-slate-800">{fatherName}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">3. Mother's Name:</td>
            <td className="py-2.5 px-3 font-bold text-slate-800">{motherName}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">4. Gender & Date of Birth:</td>
            <td className="py-2.5 px-3 font-bold text-slate-800">
              {gender} • {formatDateDDMMYYYY(dob)} {dobInWords ? `(${dobInWords})` : ''}
            </td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">5. Class & Section Last Studied:</td>
            <td className="py-2.5 px-3 font-bold text-slate-800">
              {className} - {section} {rollNo ? `(Roll No: ${rollNo})` : ''}
            </td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">6. Date of First Admission:</td>
            <td className="py-2.5 px-3 font-bold text-slate-800">{formatDateDDMMYYYY(admissionDate)}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">7. Final Examination Result:</td>
            <td className="py-2.5 px-3 font-black text-emerald-700 uppercase">{result || 'PASSED'}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">8. Fee Clearance Status:</td>
            <td className="py-2.5 px-3 font-extrabold">
              <span className={`px-2 py-0.5 rounded ${
                feeClearanceStatus.includes('CLEARED')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {feeClearanceStatus}
              </span>
            </td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">9. Date of Leaving School:</td>
            <td className="py-2.5 px-3 font-bold text-slate-800">{formatDateDDMMYYYY(leavingDate)}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">10. Reason for Leaving:</td>
            <td className="py-2.5 px-3 font-bold text-slate-800">{reason}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2.5 px-3 font-bold text-slate-500">11. General Conduct & Remarks:</td>
            <td className="py-2.5 px-3 font-medium text-slate-800">
              Conduct: <strong>{conduct}</strong> • Remarks: <em>{remarks}</em>
            </td>
          </tr>
        </tbody>
      </table>

      {/* SIGNATORIES & SEAL SECTION */}
      <div className="pt-8 pb-2 flex items-end justify-between text-xs font-sans relative">
        {/* Left Signatory */}
        <div className="text-center w-1/3">
          <div className="h-10"></div>
          <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
            {template.signatory1 || 'Class Teacher'}
          </div>
        </div>

        {/* Center Signatory & Official Seal Graphic */}
        <div className="text-center w-1/3 flex flex-col items-center justify-end">
          {template.showSeal && (
            <div
              className="w-18 h-18 rounded-full border-2 border-dashed flex flex-col items-center justify-center text-[9px] font-black tracking-tighter uppercase p-1 transform rotate-12 mb-1 shadow-sm"
              style={{ color: themeColor, borderColor: themeColor }}
            >
              <div className="w-full text-center leading-tight">OFFICIAL SEAL</div>
              <div className="text-[7px] text-slate-500 font-mono mt-0.5">{schoolName.substring(0, 18)}</div>
            </div>
          )}
          <div className="w-full border-t border-slate-400 pt-1 font-bold text-slate-800">
            {template.signatory2 || 'Verified By'}
          </div>
        </div>

        {/* Right Signatory */}
        <div className="text-center w-1/3">
          <div className="h-10"></div>
          <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
            {template.signatory3 || 'Principal'}
          </div>
        </div>
      </div>

      {/* FOOTER DISCLAIMER (IF CONFIGURED) */}
      {template.footerDisclaimer && template.footerDisclaimer.trim() !== '' && (
        <div className="pt-2 border-t border-slate-200 text-center text-[10px] font-sans text-slate-500 italic">
          {template.footerDisclaimer}
        </div>
      )}
    </div>
  );
};
