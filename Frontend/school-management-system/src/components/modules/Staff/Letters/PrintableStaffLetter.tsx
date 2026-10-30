import React, { useMemo } from 'react';
import { SchoolProfile } from '../../../../types';
import { StaffLetterPayload, StaffLetterType } from '../../../../types/staffLetter';
import { formatDateDDMMYYYY } from '../../../../utils/dateValidation';
import { formatCurrency } from '../../../../utils/currency';
import { SchoolPrintHeader } from '../../../common/SchoolPrintHeader';
import { useData } from '../../../../context/DataContext';

interface PrintableStaffLetterProps {
  type: StaffLetterType;
  payload: StaffLetterPayload;
  schoolProfile?: SchoolProfile;
}

export const PrintableStaffLetter: React.FC<PrintableStaffLetterProps> = ({
  type,
  payload,
  schoolProfile,
}) => {
  const { schoolProfile: contextSchoolProfile } = useData();
  const activeSchoolProfile = schoolProfile || contextSchoolProfile;
  const schoolName = activeSchoolProfile?.name || 'School Administration';

  const formattedIssueDate = formatDateDDMMYYYY(payload.issueDate) || payload.issueDate;
  const formattedJoiningDate = formatDateDDMMYYYY(payload.joiningDate) || payload.joiningDate;
  const formattedRelievingDate = payload.relievingDate ? formatDateDDMMYYYY(payload.relievingDate) || payload.relievingDate : '';

  // Resolve effective signature image from payload, global settings, or school profile
  const effectiveSignature = useMemo(() => {
    if (payload.signatureImageUrl) return payload.signatureImageUrl;
    return (activeSchoolProfile as any)?.signature || (activeSchoolProfile as any)?.principalSignature || '';
  }, [payload.signatureImageUrl, activeSchoolProfile]);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: '11px',
        lineHeight: '1.45',
        boxSizing: 'border-box'
      }}
      className="printable-staff-letter bg-white text-slate-900 font-sans p-6 sm:p-7 max-w-[800px] mx-auto shadow-md print:shadow-none print:p-0 print:max-w-full print:min-h-0 print:h-auto print:border-none text-[11px] leading-snug border border-slate-200 min-h-0 md:min-h-[960px] print:min-h-0 flex flex-col justify-between print:block"
    >
      {/* Top Header / Letterhead */}
      <div>
        <SchoolPrintHeader showAlways={true} compact={true} className="pb-2 mb-2 border-b-2 border-slate-900" />

        {/* Ref & Date Row */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontFamily: 'monospace', fontSize: '10.5px', color: '#334155' }}
          className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2 font-mono text-[10.5px] text-slate-700"
        >
          <div>
            <strong>Ref No:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{payload.refNo}</span>
          </div>
          <div>
            <strong>Date:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{formattedIssueDate}</span>
          </div>
        </div>

        {/* Addressee Info */}
        <div style={{ marginBottom: '8px', fontSize: '11px', color: '#1e293b' }} className="mb-2 space-y-0.5 text-xs text-slate-800">
          <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px', color: '#64748b', margin: '0 0 1px 0' }}>To,</p>
          <p style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0' }}>{payload.candidateName}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '10px', color: '#475569', margin: '1px 0' }}>
            {payload.empId && (
              <span>Employee ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{payload.empId}</strong></span>
            )}
            {payload.phone && (
              <span>Mobile: <strong style={{ color: '#0f172a' }}>{payload.phone}</strong></span>
            )}
            {payload.email && (
              <span>Email: <strong style={{ color: '#0f172a' }}>{payload.email}</strong></span>
            )}
          </div>
          {payload.address && <p style={{ color: '#475569', maxWidth: '520px', fontSize: '10px', margin: '1px 0 0 0' }}>Address: {payload.address}</p>}
        </div>

        {/* ========================================================================= */}
        {/* OFFER LETTER CONTENT                                                      */}
        {/* ========================================================================= */}
        {type === 'offer' && (
          <div className="space-y-2">
            <div
              style={{ backgroundColor: '#f0f9ff', borderLeft: '4px solid #0284c7', padding: '6px 10px', borderRadius: '0 6px 6px 0', marginBottom: '8px' }}
              className="bg-sky-50/70 border-l-4 border-sky-600 p-2 rounded-r-lg mb-2"
            >
              <p style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.025em', margin: 0 }}>
                Subject: Offer of Employment & Letter of Appointment for the post of {payload.designation}
              </p>
            </div>

            <p style={{ margin: '0 0 4px 0', fontSize: '11px' }}>
              Dear <strong>{payload.candidateName}</strong>,
            </p>

            <p style={{ margin: '0 0 8px 0', textAlign: 'justify', fontSize: '11px', lineHeight: '1.45' }}>
              With reference to your application and subsequent personal interview and evaluation, we are pleased to offer you the position of{' '}
              <strong>{payload.designation}</strong> in the Department of <strong>{payload.department}</strong> at <strong>{schoolName}</strong> ({payload.branch}).
            </p>

            {/* Key Terms Summary Grid - 4-Column Executive Layout */}
            <div
              style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', margin: '8px 0', pageBreakInside: 'avoid', breakInside: 'avoid' }}
              className="border border-slate-200 rounded-lg overflow-hidden my-2 print:rounded-none print:border-slate-300 print:break-inside-avoid print:page-break-inside-avoid"
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left' }} className="w-full text-left text-xs border-collapse">
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f8fafc', width: '22%' }}>Designation:</td>
                    <td style={{ padding: '5px 8px', fontWeight: 900, color: '#0f172a', width: '28%' }}>{payload.designation}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f8fafc', width: '22%', borderLeft: '1px solid #e2e8f0' }}>Department:</td>
                    <td style={{ padding: '5px 8px', color: '#1e293b', width: '28%' }}>{payload.department} ({payload.branch})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f8fafc' }}>Date of Joining:</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#0f172a' }}>{formattedJoiningDate}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>Probation:</td>
                    <td style={{ padding: '5px 8px', color: '#1e293b' }}>{payload.probationMonths || 6} Months</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f8fafc' }}>Working Hours:</td>
                    <td style={{ padding: '5px 8px', color: '#1e293b' }}>
                      {payload.workingHours || (activeSchoolProfile?.staffCheckInTime && activeSchoolProfile?.staffCheckOutTime ? `${activeSchoolProfile.staffCheckInTime} – ${activeSchoolProfile.staffCheckOutTime}` : '08:30 AM – 05:00 PM')}
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>Reporting To:</td>
                    <td style={{ padding: '5px 8px', color: '#1e293b', fontWeight: 600 }}>{payload.authorizedSignatoryTitle || 'Principal & School Admin'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Compensation Details Table */}
            {payload.salaryBreakdown && (
              <div style={{ margin: '8px 0', pageBreakInside: 'avoid', breakInside: 'avoid' }} className="my-2 print:break-inside-avoid print:page-break-inside-avoid">
                <p style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1e293b', marginBottom: '4px' }}>
                  Compensation & Remuneration Structure (CTC):
                </p>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }} className="border border-slate-300 rounded-lg overflow-hidden print:rounded-none">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }} className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: '#f0f9ff', color: '#0369a1', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '4.5px 8px' }}>Salary Component</th>
                        <th style={{ padding: '4.5px 8px', textAlign: 'right', width: '28%' }}>Monthly (INR)</th>
                        <th style={{ padding: '4.5px 8px', textAlign: 'right', width: '28%' }}>Annualized CTC (INR)</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontFamily: 'monospace' }} className="divide-y divide-slate-100 font-mono">
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '4px 8px', fontFamily: 'sans-serif', fontWeight: 500, color: '#334155' }}>Basic Pay</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(payload.salaryBreakdown.basic)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#475569' }}>{formatCurrency(payload.salaryBreakdown.basic * 12)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '4px 8px', fontFamily: 'sans-serif', fontWeight: 500, color: '#334155' }}>House Rent Allowance (HRA)</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(payload.salaryBreakdown.hra)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#475569' }}>{formatCurrency(payload.salaryBreakdown.hra * 12)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '4px 8px', fontFamily: 'sans-serif', fontWeight: 500, color: '#334155' }}>Transport & Special Allowances</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(payload.salaryBreakdown.specialAllowance + payload.salaryBreakdown.transportAllowance)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#475569' }}>{formatCurrency((payload.salaryBreakdown.specialAllowance + payload.salaryBreakdown.transportAllowance) * 12)}</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f8fafc', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #94a3b8' }}>
                        <td style={{ padding: '5px 8px', fontFamily: 'sans-serif' }}>Total Gross Salary (Cost to School CTC)</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0369a1' }}>{formatCurrency(payload.salaryBreakdown.grossMonthly)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0369a1' }}>{formatCurrency(payload.salaryBreakdown.annualCtc)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            <div style={{ marginTop: '8px', fontSize: '9.5px', color: '#334155', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a', fontSize: '9.5px', margin: '0 0 3px 0' }}>
                Terms & Conditions of Employment:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {(payload.customTerms || []).map((term: string, idx: number) => {
                  const colonIdx = term.indexOf(':');
                  const hasLabel = colonIdx > 0 && colonIdx < 35;
                  const label = hasLabel ? term.substring(0, colonIdx) : null;
                  const rest = hasLabel ? term.substring(colonIdx + 1).trim() : term;

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', lineHeight: '1.38', textAlign: 'justify' }}>
                      <span style={{ fontWeight: 'bold', color: '#0284c7', minWidth: '14px', flexShrink: 0 }}>{idx + 1}.</span>
                      <p style={{ margin: 0 }}>
                        {label && <strong style={{ color: '#0f172a' }}>{label}: </strong>}
                        <span>{rest}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RELIEVING LETTER CONTENT                                                  */}
        {/* ========================================================================= */}
        {type === 'relieving' && (
          <div className="space-y-2.5">
            <div className="bg-sky-50/70 border-l-4 border-sky-600 p-2 rounded-r-lg">
              <p className="font-bold text-sky-900 text-[11px] uppercase tracking-wide">
                Subject: Relieving Order & Clearance Certificate – Emp ID: {payload.empId || 'N/A'}
              </p>
            </div>

            <p className="text-justify text-[11px]">
              This is to certify that <strong>{payload.candidateName}</strong> (Employee ID: <strong>{payload.empId || 'N/A'}</strong>) was employed with{' '}
              <strong>{schoolName}</strong> ({payload.branch}) as <strong>{payload.designation}</strong> in the Department of <strong>{payload.department}</strong>.
            </p>

            {/* Service Record Box */}
            <div className="border border-slate-200 rounded-lg overflow-hidden my-2 print:rounded-none print:border-slate-300 print:break-inside-avoid print:page-break-inside-avoid">
              <table className="w-full text-left text-[10.5px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2 font-bold text-slate-600 w-1/3">Employee Name:</td>
                    <td className="p-2 font-black text-slate-900">{payload.candidateName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold text-slate-600">Designation & Department:</td>
                    <td className="p-2 text-slate-800">{payload.designation} &bull; {payload.department}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2 font-bold text-slate-600">Date of Joining:</td>
                    <td className="p-2 font-bold text-slate-900">{formattedJoiningDate}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold text-slate-600">Date of Relieving (LWD):</td>
                    <td className="p-2 font-bold text-rose-700">{formattedRelievingDate}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2 font-bold text-slate-600">Departmental Dues & Clearance:</td>
                    <td className="p-2 text-emerald-700 font-bold">
                      {payload.noDuesCleared ? '✅ All institutional accounts, library & lab assets fully cleared' : 'Clearance Pending'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-600">Character & Conduct Appraisal:</td>
                    <td className="p-2 font-black text-slate-900">{payload.conductRating || 'Exemplary'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-justify text-slate-800 text-[11px] leading-relaxed">
              Consequent to the acceptance of your resignation dated <strong>{formattedRelievingDate}</strong>, you stand relieved from your official duties as{' '}
              <strong>{payload.designation}</strong> with effect from the close of working hours on <strong>{formattedRelievingDate}</strong>.
            </p>

            <p className="text-justify text-slate-800 text-[11px] leading-relaxed">
              During tenure with <strong>{schoolName}</strong>, <strong>{payload.candidateName}</strong> was found to be sincere, dedicated, and diligent in discharging the assigned academic and administrative responsibilities.
            </p>

            <p className="text-slate-800 text-[11px]">
              We express our gratitude for the valuable contributions made to the institution and wish every success in future personal and professional endeavors.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXPERIENCE CERTIFICATE CONTENT                                            */}
        {/* ========================================================================= */}
        {type === 'experience' && (
          <div className="space-y-2.5">
            <div className="bg-sky-50/70 border-l-4 border-sky-600 p-2 rounded-r-lg text-center">
              <p className="font-black text-sky-950 text-xs uppercase tracking-wider">
                TO WHOMSOEVER IT MAY CONCERN
              </p>
              <p className="text-[11px] font-bold text-sky-700">SERVICE & EXPERIENCE CERTIFICATE</p>
            </div>

            <p className="text-justify leading-relaxed mt-2 text-[11px]">
              This is to proudly certify that <strong>{payload.candidateName}</strong> (Employee ID: <strong>{payload.empId || 'N/A'}</strong>) was an integral part of{' '}
              <strong>{schoolName}</strong> ({payload.branch}) serving in the capacity of <strong>{payload.designation}</strong> in the Department of <strong>{payload.department}</strong>.
            </p>

            <p className="text-justify leading-relaxed text-[11px]">
              The period of service rendered with our institution was from <strong>{formattedJoiningDate}</strong> to{' '}
              <strong>{formattedRelievingDate || formattedIssueDate}</strong>.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 my-2 text-[10.5px] space-y-1.5">
              <p>
                <strong>Roles & Responsibilities Undertaken:</strong> Academic instruction, lesson planning, student mentoring, classroom governance, and institutional co-curricular contributions.
              </p>
              <p>
                <strong>Overall Conduct & Performance:</strong> <span className="font-bold text-emerald-700">{payload.conductRating || 'Exemplary'}</span>
              </p>
            </div>

            <p className="text-justify leading-relaxed text-[11px]">
              During the tenure with us, <strong>{payload.candidateName}</strong> exhibited exceptional professional competence, moral integrity, and high pedagogical standards.
            </p>

            <p className="text-justify text-[11px]">
              We take this opportunity to commend the dedication shown towards student welfare and wish every success in all future pursuits.
            </p>
          </div>
        )}
      </div>

      {/* Footer Signatures Block */}
      <div
        style={{
          borderTop: '1px solid #cbd5e1',
          marginTop: '10px',
          paddingTop: '8px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          width: '100%'
        }}
        className="pt-2.5 border-t border-slate-300 mt-2.5 print:break-inside-avoid print:page-break-inside-avoid"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            gap: '24px'
          }}
          className="flex flex-row items-end justify-between gap-6"
        >
          {/* Candidate Acceptance (Only in Offer Letter) */}
          {type === 'offer' ? (
            <div style={{ textAlign: 'left', width: '250px', flexShrink: 0 }}>
              <p style={{ fontSize: '8.5px', color: '#64748b', fontStyle: 'italic', margin: '0 0 4px 0' }}>
                I accept the appointment on the terms & conditions stated above:
              </p>
              <div style={{ height: '36px', borderBottom: '1px dashed #94a3b8', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '3px' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>Candidate Signature & Date</span>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0' }}>{payload.candidateName}</p>
              <p style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 600, margin: '1px 0 0 0' }}>(Accepted & Confirmed)</p>
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', width: '250px', flexShrink: 0 }}>
              <p style={{ margin: '0 0 2px 0' }}>Verified by: HR Department</p>
              <p style={{ margin: 0 }}>Document Security ID: {payload.refNo}</p>
            </div>
          )}

          {/* Official Stamp & Signatory */}
          <div style={{ textAlign: 'center', width: '230px', flexShrink: 0 }}>
            <p style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px 0' }}>
              For {schoolName}
            </p>
            <div style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
              {effectiveSignature ? (
                <img
                  src={effectiveSignature}
                  alt="Authorized Signatory Signature"
                  style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ border: '1px solid #7dd3fc', borderRadius: '6px', background: '#f0f9ff', padding: '3px 10px', fontSize: '8px', fontWeight: 900, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.08em', transform: 'rotate(-3deg)' }}>
                  Official Seal
                </div>
              )}
            </div>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em', margin: '2px 0 0 0' }}>
              {payload.authorizedSignatoryName}
            </p>
            <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569', margin: '1px 0 0 0' }}>
              {payload.authorizedSignatoryTitle}
            </p>
            <p style={{ fontSize: '8.5px', fontWeight: 600, color: '#0284c7', textTransform: 'uppercase', margin: '1px 0 0 0' }}>
              {schoolName}
            </p>
          </div>
        </div>

        {/* Full-width Centered Verification Micro-Footer */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '8px',
            color: '#94a3b8',
            marginTop: '8px',
            paddingTop: '4px',
            borderTop: '1px solid #f1f5f9',
            fontFamily: 'monospace',
            width: '100%'
          }}
        >
          This is an official document generated by {schoolName} ERP HR System &bull; Verification Link available via institutional registry
        </div>
      </div>
    </div>
  );
};
