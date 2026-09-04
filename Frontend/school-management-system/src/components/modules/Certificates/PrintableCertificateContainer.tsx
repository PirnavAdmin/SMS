// @ts-nocheck
import React from "react";
import { CertificateTemplateConfig, SchoolProfile } from "../../../types";
import { formatDateDDMMYYYY } from "../../../utils/dateValidation";
import { resolveMediaUrl } from "../../../utils/mediaUtils";

export interface PrintableCertificateContainerProps {
  template: CertificateTemplateConfig;
  schoolProfile: SchoolProfile;
  academicYear: string;
  studentName: string;
  admissionNo: string;
  admissionDate?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  dobInWords?: string;
  gender?: string;
  className?: string;
  section?: string;
  rollNo?: string;
  leavingDate?: string;
  reason?: string;
  conduct?: string;
  remarks?: string;
  result?: string;
  feeClearanceStatus?: string;
  tcNo?: string;
  certificateNumber?: string;
  issueDate: string;
  isDraftPreview?: boolean;
  fieldDataSnapshot?: Record<string, any>;
  identificationMarks?: string;
  moleIdentification?: string;
}

export const PrintableCertificateContainer: React.FC<
  PrintableCertificateContainerProps
> = ({
  template,
  schoolProfile,
  academicYear,
  studentName,
  admissionNo,
  admissionDate = "",
  fatherName = "",
  motherName = "",
  dob = "",
  dobInWords = "",
  gender = "",
  className = "",
  section = "",
  rollNo = "",
  leavingDate = "",
  reason = "",
  conduct = "",
  remarks = "",
  result = "",
  feeClearanceStatus = "",
  tcNo = "",
  certificateNumber = "",
  issueDate,
  isDraftPreview = false,
  fieldDataSnapshot,
  identificationMarks = "",
  moleIdentification = "",
}) => {
  const themeColor = template.themeColor || "#1e3a8a";
  const schoolName = schoolProfile.name || "Pirnav Educational Institutions";
  const schoolAddress =
    schoolProfile.address ||
    "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081";
  const schoolPhone = schoolProfile.phone || "+91 9123456789";
  const schoolEmail = schoolProfile.email || "contact@pirnavschools.edu";
  const schoolLogoUrl = resolveMediaUrl(schoolProfile.logoUrl);

  // Header Style Variations
  const getContainerStyle = () => {
    switch (template.headerStyle) {
      case "Modern Minimalist":
        return {
          border: `2px solid ${themeColor}`,
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        };
      case "Royal Gold Crest":
        return {
          border: `3px solid ${themeColor}`,
          outline: "3px double #d97706",
          outlineOffset: "-10px",
          borderRadius: "4px",
        };
      case "Executive Slate":
        return {
          border: "4px solid #334155",
          borderRadius: "8px",
        };
      case "Classic Double Border":
      default:
        return {
          border: `8px double ${themeColor}`,
          borderRadius: "8px",
        };
    }
  };

  const signatoriesList =
    Array.isArray(template.signatories) && template.signatories.length > 0
      ? template.signatories.filter((s) => s.show !== false)
      : [
          {
            id: "1",
            title: (template as any).signatory1 || "Class Teacher",
            show: true,
          },
          {
            id: "2",
            title: (template as any).signatory2 || "Accounts Officer",
            show: true,
          },
          {
            id: "3",
            title: (template as any).signatory3 || "Principal",
            name: "Dr. Robert Miller",
            show: true,
          },
        ];

  const displayCertNo = certificateNumber || tcNo || "TC-2026-001";
  const isTransferCertificateType =
    !template.certificateType ||
    template.certificateType.toLowerCase().includes("transfer") ||
    (template.title && template.title.toLowerCase().includes("transfer"));

  const renderInterpolatedBody = () => {
    let body = template.bodyTemplate || "";

    // Standard Replacements
    body = body
      .replace(/{{studentName}}/gi, studentName)
      .replace(/{{admissionNumber}}/gi, admissionNo)
      .replace(/{{admissionNo}}/gi, admissionNo)
      .replace(/{{class}}/gi, className)
      .replace(/{{className}}/gi, className)
      .replace(/{{section}}/gi, section)
      .replace(/{{rollNo}}/gi, rollNo)
      .replace(/{{academicYear}}/gi, academicYear)
      .replace(/{{fatherName}}/gi, fatherName)
      .replace(/{{motherName}}/gi, motherName)
      .replace(/{{dateOfBirth}}/gi, formatDateDDMMYYYY(dob))
      .replace(/{{dob}}/gi, formatDateDDMMYYYY(dob))
      .replace(/{{dobInWords}}/gi, dobInWords)
      .replace(/{{dateOfAdmission}}/gi, formatDateDDMMYYYY(admissionDate))
      .replace(/{{schoolName}}/gi, schoolName)
      .replace(/{{schoolAddress}}/gi, schoolAddress)
      .replace(/{{certificateNumber}}/gi, displayCertNo)
      .replace(/{{issueDate}}/gi, formatDateDDMMYYYY(issueDate))
      .replace(/{{leavingDate}}/gi, formatDateDDMMYYYY(leavingDate || fieldDataSnapshot?.dateOfLeaving))
      .replace(/{{dateOfLeaving}}/gi, formatDateDDMMYYYY(leavingDate || fieldDataSnapshot?.dateOfLeaving))
      .replace(/{{reason}}/gi, reason || fieldDataSnapshot?.reasonForLeaving || fieldDataSnapshot?.purpose || '')
      .replace(/{{reasonForLeaving}}/gi, reason || fieldDataSnapshot?.reasonForLeaving || fieldDataSnapshot?.purpose || '')
      .replace(/{{conduct}}/gi, conduct || fieldDataSnapshot?.generalConduct || '')
      .replace(/{{remarks}}/gi, remarks || fieldDataSnapshot?.specialRemarks || fieldDataSnapshot?.remarks || '')
      .replace(/{{moleIdentification}}/gi, moleIdentification || identificationMarks || fieldDataSnapshot?.moleIdentification || fieldDataSnapshot?.identificationMarks || '')
      .replace(/{{identificationMarks}}/gi, moleIdentification || identificationMarks || fieldDataSnapshot?.moleIdentification || fieldDataSnapshot?.identificationMarks || '');

    // Dynamic fieldDataSnapshot Replacements
    if (fieldDataSnapshot) {
      Object.keys(fieldDataSnapshot).forEach(key => {
        const val = fieldDataSnapshot[key];
        if (val !== undefined && val !== null && val !== '') {
          const formattedVal = (key.toLowerCase().includes('date') && typeof val === 'string' && val.includes('-')) 
            ? formatDateDDMMYYYY(val) 
            : String(val);
          const regex = new RegExp(`{{${key}}}`, 'gi');
          body = body.replace(regex, formattedVal);
        }
      });
    }

    // Clean up unreplaced optional placeholders
    body = body.replace(/{{[a-zA-Z0-9_]+}}/g, '—');

    return (
      <div className="py-6 px-4 text-slate-800 leading-relaxed text-sm sm:text-base font-serif whitespace-pre-wrap">
        {body}
      </div>
    );
  };

  return (
    <div
      id="printable-certificate"
      className="printable-area bg-white text-slate-900 p-8 sm:p-10 font-serif relative max-w-4xl mx-auto shadow-2xl space-y-6 print:shadow-none print:m-0 print:w-full print:max-w-none"
      style={getContainerStyle()}
    >
      {/* Top Accent Bar */}
      {template.headerStyle === "Modern Minimalist" && (
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
      <div
        className={`text-center space-y-2 pb-4 ${
          template.headerStyle === "Executive Slate"
            ? "bg-slate-800 text-white -mx-8 sm:-mx-10 -mt-8 sm:-mt-10 p-6 rounded-t-sm mb-4"
            : "border-b-2"
        }`}
        style={
          template.headerStyle !== "Executive Slate"
            ? { borderColor: themeColor }
            : undefined
        }
      >
        {/* LOGO & SCHOOL BRANDING */}
        <div className="flex flex-col items-center justify-center text-center space-y-1 pt-1">
          {template.showLogo &&
            (schoolLogoUrl ? (
              <img
                src={schoolLogoUrl}
                alt="School Logo"
                className="w-16 h-16 object-contain mb-0.5"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl mb-0.5 shadow-xs"
                style={{ backgroundColor: themeColor }}
              >
                {schoolName[0]}
              </div>
            ))}
          <div>
            <h1
              className={`text-2xl sm:text-3xl font-black tracking-wide uppercase font-sans ${
                template.headerStyle === "Executive Slate"
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              {schoolName}
            </h1>
            <p
              className={`text-xs font-sans mt-0.5 max-w-xl mx-auto leading-normal ${
                template.headerStyle === "Executive Slate"
                  ? "text-slate-300"
                  : "text-slate-600"
              }`}
            >
              {schoolAddress} • Ph: {schoolPhone} • Email: {schoolEmail}
            </p>
          </div>
        </div>

        {/* CERTIFICATE TITLE BADGE */}
        <div className="pt-2">
          <span
            className="px-6 py-1 rounded-full text-white text-xs sm:text-sm font-black tracking-widest uppercase font-sans inline-block shadow-md"
            style={{ backgroundColor: themeColor }}
          >
            {template.title || "OFFICIAL CERTIFICATE"}
          </span>
        </div>

        {/* METADATA BADGE BAR - 2 COLUMN BALANCED GRID */}
        <div
          className={`grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-sans pt-3 px-3 border-t border-slate-200/80 mt-3 ${
            template.headerStyle === "Executive Slate"
              ? "text-slate-300 border-slate-700"
              : "text-slate-600"
          }`}
        >
          <div className="text-left font-sans">
            <span className="text-slate-500 font-medium">Cert No:</span>{" "}
            <strong className="font-mono text-slate-900 font-bold ml-1">
              {displayCertNo}
            </strong>
          </div>
          <div className="text-right font-sans">
            <span className="text-slate-500 font-medium">
              Academic Session:
            </span>{" "}
            <strong className="font-mono text-slate-900 font-bold ml-1">
              {academicYear}
            </strong>
          </div>
          <div className="text-left font-sans">
            <span className="text-slate-500 font-medium">Issue Date:</span>{" "}
            <strong className="font-mono text-slate-900 font-bold ml-1">
              {formatDateDDMMYYYY(issueDate)}
            </strong>
          </div>
          <div className="text-right font-sans">
            <span className="text-slate-500 font-medium">Adm No:</span>{" "}
            <strong className="font-mono text-slate-900 font-bold ml-1">
              {admissionNo}
            </strong>
          </div>
        </div>
      </div>

      {/* CUSTOM PREAMBLE (IF CONFIGURED) */}
      {(template as any).customPreamble &&
        (template as any).customPreamble.trim() !== "" && (
          <div className="py-2 px-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <p className="text-xs sm:text-sm italic font-serif text-slate-700 leading-relaxed">
              "{(template as any).customPreamble}"
            </p>
          </div>
        )}

      {/* RENDER CONTENT: TABULAR FOR TC vs DYNAMIC INTERPOLATED PARAGRAPH FOR OTHER CERTIFICATES */}
      {template.bodyTemplate && template.bodyTemplate.trim() !== "" ? (
        renderInterpolatedBody()
      ) : isTransferCertificateType ? (
        /* FORMAL TABULAR LAYOUT FOR TRANSFER CERTIFICATE */
        <table className="w-full text-xs sm:text-sm border-collapse font-sans">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500 w-1/2">
                1. Name of Student:
              </td>
              <td className="py-2.5 px-3 font-black text-slate-900 uppercase text-sm">
                {studentName}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                2. Father's / Guardian's Name:
              </td>
              <td className="py-2.5 px-3 font-bold text-slate-800">
                {fatherName || "—"}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                3. Mother's Name:
              </td>
              <td className="py-2.5 px-3 font-bold text-slate-800">
                {motherName || "—"}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                4. Gender & Date of Birth:
              </td>
              <td className="py-2.5 px-3 font-bold text-slate-800">
                {gender || "—"} • {formatDateDDMMYYYY(dob)}{" "}
                {dobInWords ? `(${dobInWords})` : ""}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                5. Class & Section Last Studied:
              </td>
              <td className="py-2.5 px-3 font-bold text-slate-800">
                {className} - {section} {rollNo ? `(Roll No: ${rollNo})` : ""}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                6. Date of First Admission:
              </td>
              <td className="py-2.5 px-3 font-bold text-slate-800">
                {formatDateDDMMYYYY(admissionDate)}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                7. Final Examination Result:
              </td>
              <td className="py-2.5 px-3 font-black text-emerald-700 uppercase">
                {result || "PASSED"}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                8. Fee Clearance Status:
              </td>
              <td className="py-2.5 px-3 font-extrabold">
                <span
                  className={`px-2 py-0.5 rounded ${
                    (feeClearanceStatus || "").includes("CLEARED") ||
                    (feeClearanceStatus || "").includes("Paid")
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {feeClearanceStatus || "FULL DUES CLEARED"}
                </span>
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                9. Date of Leaving School:
              </td>
              <td className="py-2.5 px-3 font-bold text-slate-800">
                {formatDateDDMMYYYY(leavingDate || fieldDataSnapshot?.dateOfLeaving)}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                10. Reason for Leaving:
              </td>
              <td className="py-2.5 px-3 font-bold text-slate-800">
                {reason || fieldDataSnapshot?.reasonForLeaving || fieldDataSnapshot?.purpose || "Course Completed"}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                11. General Conduct & Remarks:
              </td>
              <td className="py-2.5 px-3 font-medium text-slate-800">
                Conduct: <strong>{conduct || fieldDataSnapshot?.generalConduct || "Good"}</strong> • Remarks:{" "}
                <em>{remarks || fieldDataSnapshot?.specialRemarks || fieldDataSnapshot?.remarks || "Satisfactory"}</em>
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2.5 px-3 font-bold text-slate-500">
                12. Personal Identification / Mole Marks:
              </td>
              <td className="py-2.5 px-3 font-semibold text-slate-800">
                {fieldDataSnapshot?.moleIdentification ||
                  fieldDataSnapshot?.identificationMarks ||
                  moleIdentification ||
                  identificationMarks ||
                  "1. A mole on right cheek  2. A mole on left shoulder"}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        /* DYNAMIC DEDICATED LAYOUT FOR NON-TC CERTIFICATES */
        <div className="py-6 px-4 space-y-4">
          <div className="text-sm sm:text-base leading-relaxed text-slate-800 font-serif text-justify">
            This is to certify that <strong>{studentName}</strong>, Admission No.{" "}
            <strong>{admissionNo}</strong>, Class{" "}
            <strong>
              {className} {section ? `- ${section}` : ''}
            </strong>
            , is a student of <strong>{schoolName}</strong> for the Academic
            Session <strong>{academicYear}</strong>. Issued on{" "}
            <strong>{formatDateDDMMYYYY(issueDate)}</strong>.
          </div>

          {/* Dynamic Field Values Grid */}
          {fieldDataSnapshot && Object.keys(fieldDataSnapshot).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
              {Object.entries(fieldDataSnapshot)
                .filter(([k]) => !['studentName', 'admissionNumber', 'class', 'section', 'academicYear', 'dateOfBirth', 'fatherName', 'dateOfAdmission', 'certificateNumber', 'issueDate'].includes(k))
                .map(([key, val]) => {
                  if (val === undefined || val === null || val === '') return null;
                  const labelFormatted = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());

                  return (
                    <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium block text-[11px] uppercase tracking-wider">{labelFormatted}</span>
                      <span className="text-slate-900 font-bold text-xs">{String(val)}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* SIGNATORIES & SEAL SECTION */}
      <div className="pt-8 pb-2 flex items-end justify-between text-xs font-sans relative">
        {signatoriesList.map((sig, idx) => (
          <div key={sig.id || idx} className="text-center flex-1 px-2">
            <div className="h-10 flex items-end justify-center pb-1">
              {(sig as any).signatureUrl ? (
                <img
                  src={(sig as any).signatureUrl}
                  alt={sig.title}
                  className="h-8 object-contain"
                />
              ) : null}
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              {sig.title}
              {sig.name && (
                <p className="text-[10px] text-slate-500 font-normal">
                  {sig.name}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Center Official Seal / Stamp Graphic */}
        {template.showSeal && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-center pointer-events-none">
            {template.sealImageUrl ? (
              <img
                src={template.sealImageUrl}
                alt="Official School Stamp"
                className="w-20 h-20 object-contain transform rotate-6 opacity-90"
              />
            ) : (
              <div
                className="w-18 h-18 rounded-full border-2 border-dashed flex flex-col items-center justify-center text-[9px] font-black tracking-tighter uppercase p-1 transform rotate-12 mb-1 shadow-sm bg-white/80"
                style={{ color: themeColor, borderColor: themeColor }}
              >
                <div className="w-full text-center leading-tight">
                  {template.sealText || "OFFICIAL SEAL"}
                </div>
                <div className="text-[7px] text-slate-500 font-mono mt-0.5">
                  {schoolName.substring(0, 18)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER DISCLAIMER */}
      {(template.footerText || (template as any).footerDisclaimer) && (
        <div className="pt-2 border-t border-slate-200 text-center text-[10px] font-sans text-slate-500 italic">
          {template.footerText || (template as any).footerDisclaimer}
        </div>
      )}
    </div>
  );
};

export interface PrintableBatchCertificatesContainerProps {
  records: GeneratedCertificateRecord[];
  schoolProfile: SchoolProfile;
}

export const PrintableBatchCertificatesContainer: React.FC<PrintableBatchCertificatesContainerProps> = ({
  records,
  schoolProfile
}) => {
  return (
    <div className="printable-batch-container space-y-8 print:space-y-0">
      {records.map((rec, index) => {
        const snapshot = rec.fieldDataSnapshot || {};
        const template = rec.templateSnapshot || {
          id: `TPL-${rec.certificateTypeId}`,
          certificateTypeId: rec.certificateTypeId,
          certificateTypeName: rec.certificateTypeName,
          title: (rec.certificateTypeName || 'CERTIFICATE').toUpperCase(),
          headerStyle: 'Classic Double Border' as const,
          themeColor: '#1e3a8a',
          showLogo: true,
          showSchoolHeader: true,
          bodyTemplate: `This is to certify that {{studentName}}, Admission No. {{admissionNumber}}, Class {{class}}, is a student of {{schoolName}}. Issued on {{issueDate}}.`,
          footerText: 'Official Certificate issued by School Authority.',
          signatories: [
            { id: '1', title: 'Class Teacher', show: true },
            { id: '2', title: 'Accounts Officer', show: true },
            { id: '3', title: 'Principal', name: 'Dr. Robert Miller', show: true }
          ],
          showSeal: true,
          dateFormat: 'DD/MM/YYYY'
        };

        return (
          <div key={rec.id || index} style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
            <PrintableCertificateContainer
              template={template}
              schoolProfile={schoolProfile}
              academicYear={rec.academicYear}
              studentName={rec.studentName}
              admissionNo={rec.admissionNo}
              admissionDate={snapshot.dateOfAdmission || snapshot.joiningDate || ''}
              fatherName={snapshot.fatherName || '—'}
              motherName={snapshot.motherName || '—'}
              dob={snapshot.dateOfBirth || snapshot.dob || ''}
              gender={snapshot.gender || ''}
              className={rec.className}
              section={rec.section}
              leavingDate={rec.leavingDate || snapshot.dateOfLeaving || ''}
              reason={rec.reason || snapshot.reasonForLeaving || snapshot.purpose || ''}
              conduct={rec.conduct || snapshot.generalConduct || ''}
              remarks={rec.remarks || snapshot.specialRemarks || ''}
              identificationMarks={snapshot.identificationMarks || snapshot.moleIdentification || ''}
              certificateNumber={rec.certificateNumber}
              tcNo={rec.tcNo || rec.certificateNumber}
              issueDate={rec.issueDate}
              isDraftPreview={false}
              fieldDataSnapshot={snapshot}
            />
          </div>
        );
      })}
    </div>
  );
};
