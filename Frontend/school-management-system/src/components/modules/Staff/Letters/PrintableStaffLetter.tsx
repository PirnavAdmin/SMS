import React from 'react';
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

  return (
    <div className="printable-staff-letter bg-white text-slate-900 font-sans p-6 sm:p-8 max-w-[800px] mx-auto shadow-lg print:shadow-none print:p-0 print:max-w-full text-[12.5px] leading-relaxed border border-slate-200 print:border-none min-h-[1050px] flex flex-col justify-between">
      {/* Top Header / Letterhead */}
      <div>
        <SchoolPrintHeader showAlways={true} compact={true} className="pb-2.5 mb-3.5 border-b-2 border-slate-900" />

        {/* Ref & Date Row */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3.5 font-mono text-[11px] text-slate-700">
          <div>
            <strong>Ref No:</strong> <span className="text-slate-900 font-bold">{payload.refNo}</span>
          </div>
          <div>
            <strong>Date:</strong> <span className="text-slate-900 font-bold">{formattedIssueDate}</span>
          </div>
        </div>

        {/* Addressee Info */}
        <div className="mb-3.5 space-y-0.5 text-xs text-slate-800">
          <p className="font-bold text-slate-500 uppercase tracking-wider text-[9.5px]">To,</p>
          <p className="text-sm font-black text-slate-900">{payload.candidateName}</p>
          {payload.empId && (
            <p className="font-mono text-[11px] text-slate-600 font-semibold">Employee ID: <strong>{payload.empId}</strong></p>
          )}
          {payload.address && <p className="text-slate-600 max-w-[400px] text-[11.5px]">{payload.address}</p>}
          {payload.phone && <p className="text-slate-600 font-mono text-[11.5px]">Mobile: {payload.phone}</p>}
          {payload.email && <p className="text-slate-600 text-[11.5px]">Email: {payload.email}</p>}
        </div>

        {/* ========================================================================= */}
        {/* OFFER LETTER CONTENT                                                      */}
        {/* ========================================================================= */}
        {type === 'offer' && (
          <div className="space-y-4">
            <div className="bg-sky-50/70 border-l-4 border-sky-600 p-2.5 rounded-r-lg">
              <p className="font-bold text-sky-900 text-xs uppercase tracking-wide">
                Subject: Offer of Employment & Letter of Appointment for the post of {payload.designation}
              </p>
            </div>

            <p className="text-justify">
              Dear <strong>{payload.candidateName}</strong>,
            </p>

            <p className="text-justify">
              With reference to your application and subsequent personal interview and evaluation, we are pleased to offer you the position of{' '}
              <strong>{payload.designation}</strong> in the Department of <strong>{payload.department}</strong> at <strong>{schoolName}</strong> ({payload.branch}).
            </p>

            {/* Key Terms Summary Grid */}
            <div className="border border-slate-200 rounded-xl overflow-hidden my-3">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2 font-bold text-slate-600 w-1/3">Designation / Role:</td>
                    <td className="p-2 font-black text-slate-900">{payload.designation}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold text-slate-600">Department / Campus:</td>
                    <td className="p-2 text-slate-800">{payload.department} ({payload.branch})</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2 font-bold text-slate-600">Effective Joining Date:</td>
                    <td className="p-2 font-bold text-slate-900">{formattedJoiningDate}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold text-slate-600">Probation Period:</td>
                    <td className="p-2 text-slate-800">{payload.probationMonths || 6} Months from Date of Joining</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-600">Working Hours:</td>
                    <td className="p-2 text-slate-800">{payload.workingHours || '08:30 AM – 04:00 PM'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Compensation Details Table */}
            {payload.salaryBreakdown && (
              <div className="my-3">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <span>💰 Compensation & Remuneration Structure:</span>
                </p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-sky-50 text-sky-900 font-bold border-b border-slate-200">
                        <th className="p-2">Salary Component</th>
                        <th className="p-2 text-right">Monthly (INR)</th>
                        <th className="p-2 text-right">Annualized CTC (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="p-2 font-sans font-medium text-slate-700">Basic Pay</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(payload.salaryBreakdown.basic)}</td>
                        <td className="p-2 text-right text-slate-600">{formatCurrency(payload.salaryBreakdown.basic * 12)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium text-slate-700">House Rent Allowance (HRA)</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(payload.salaryBreakdown.hra)}</td>
                        <td className="p-2 text-right text-slate-600">{formatCurrency(payload.salaryBreakdown.hra * 12)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium text-slate-700">Transport & Special Allowances</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(payload.salaryBreakdown.specialAllowance + payload.salaryBreakdown.transportAllowance)}</td>
                        <td className="p-2 text-right text-slate-600">{formatCurrency((payload.salaryBreakdown.specialAllowance + payload.salaryBreakdown.transportAllowance) * 12)}</td>
                      </tr>
                      <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                        <td className="p-2 font-sans">Total Gross Salary (CTC)</td>
                        <td className="p-2 text-right text-sky-700">{formatCurrency(payload.salaryBreakdown.grossMonthly)}</td>
                        <td className="p-2 text-right text-sky-700">{formatCurrency(payload.salaryBreakdown.annualCtc)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="space-y-1.5 text-[11.5px] text-slate-700 text-justify">
              <p className="font-bold uppercase tracking-wider text-slate-900 text-[11px]">Terms & Conditions of Employment:</p>
              <ol className="list-decimal list-outside pl-4 space-y-1 text-slate-600">
                {(payload.customTerms || []).map((term: string, idx: number) => (
                  <li key={idx} className="leading-snug">
                    {term}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RELIEVING LETTER CONTENT                                                  */}
        {/* ========================================================================= */}
        {type === 'relieving' && (
          <div className="space-y-4">
            <div className="bg-sky-50/70 border-l-4 border-sky-600 p-2.5 rounded-r-lg">
              <p className="font-bold text-sky-900 text-xs uppercase tracking-wide">
                Subject: Relieving Order & Clearance Certificate – Emp ID: {payload.empId || 'N/A'}
              </p>
            </div>

            <p className="text-justify">
              This is to certify that <strong>{payload.candidateName}</strong> (Employee ID: <strong>{payload.empId || 'N/A'}</strong>) was employed with{' '}
              <strong>{schoolName}</strong> ({payload.branch}) as <strong>{payload.designation}</strong> in the Department of <strong>{payload.department}</strong>.
            </p>

            {/* Service Record Box */}
            <div className="border border-slate-200 rounded-xl overflow-hidden my-3">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2.5 font-bold text-slate-600 w-1/3">Employee Name:</td>
                    <td className="p-2.5 font-black text-slate-900">{payload.candidateName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold text-slate-600">Designation & Department:</td>
                    <td className="p-2.5 text-slate-800">{payload.designation} &bull; {payload.department}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2.5 font-bold text-slate-600">Date of Joining:</td>
                    <td className="p-2.5 font-bold text-slate-900">{formattedJoiningDate}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold text-slate-600">Date of Relieving (LWD):</td>
                    <td className="p-2.5 font-bold text-rose-700">{formattedRelievingDate}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2.5 font-bold text-slate-600">Departmental Dues & Clearance:</td>
                    <td className="p-2.5 text-emerald-700 font-bold">
                      {payload.noDuesCleared ? '✅ All institutional accounts, library & lab assets fully cleared' : 'Clearance Pending'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-600">Character & Conduct Appraisal:</td>
                    <td className="p-2.5 font-black text-slate-900">{payload.conductRating || 'Exemplary'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-justify text-slate-800">
              Consequent to the acceptance of your resignation dated <strong>{formattedRelievingDate}</strong>, you stand relieved from your official duties as{' '}
              <strong>{payload.designation}</strong> with effect from the close of working hours on <strong>{formattedRelievingDate}</strong>.
            </p>

            <p className="text-justify text-slate-800">
              During tenure with <strong>{schoolName}</strong>, <strong>{payload.candidateName}</strong> was found to be sincere, dedicated, and diligent in discharging the assigned academic and administrative responsibilities.
            </p>

            <p className="text-slate-800">
              We express our gratitude for the valuable contributions made to the institution and wish every success in future personal and professional endeavors.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXPERIENCE CERTIFICATE CONTENT                                            */}
        {/* ========================================================================= */}
        {type === 'experience' && (
          <div className="space-y-4">
            <div className="bg-sky-50/70 border-l-4 border-sky-600 p-2.5 rounded-r-lg text-center">
              <p className="font-black text-sky-950 text-sm uppercase tracking-wider">
                TO WHOMSOEVER IT MAY CONCERN
              </p>
              <p className="text-xs font-bold text-sky-700">SERVICE & EXPERIENCE CERTIFICATE</p>
            </div>

            <p className="text-justify leading-relaxed mt-4">
              This is to proudly certify that <strong>{payload.candidateName}</strong> (Employee ID: <strong>{payload.empId || 'N/A'}</strong>) was an integral part of{' '}
              <strong>{schoolName}</strong> ({payload.branch}) serving in the capacity of <strong>{payload.designation}</strong> in the Department of <strong>{payload.department}</strong>.
            </p>

            <p className="text-justify leading-relaxed">
              The period of service rendered with our institution was from <strong>{formattedJoiningDate}</strong> to{' '}
              <strong>{formattedRelievingDate || formattedIssueDate}</strong>.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 my-4 text-xs space-y-2">
              <p>
                <strong>Roles & Responsibilities Undertaken:</strong> Academic instruction, lesson planning, student mentoring, classroom governance, and institutional co-curricular contributions.
              </p>
              <p>
                <strong>Overall Conduct & Performance:</strong> <span className="font-bold text-emerald-700">{payload.conductRating || 'Exemplary'}</span>
              </p>
            </div>

            <p className="text-justify leading-relaxed">
              During the tenure with us, <strong>{payload.candidateName}</strong> exhibited exceptional professional competence, moral integrity, and high pedagogical standards.
            </p>

            <p className="text-justify">
              We take this opportunity to commend the dedication shown towards student welfare and wish every success in all future pursuits.
            </p>
          </div>
        )}
      </div>

      {/* Footer Signatures Block */}
      <div className="pt-5 border-t border-slate-200 mt-5">
        <div className="flex items-end justify-between gap-6">
          {/* Candidate Acceptance (Only in Offer Letter) */}
          {type === 'offer' ? (
            <div className="text-center space-y-1 max-w-[240px]">
              <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[9.5px] text-slate-400 font-mono italic">Candidate Signature & Date</span>
              </div>
              <p className="text-xs font-bold text-slate-900">{payload.candidateName}</p>
              <p className="text-[9.5px] text-slate-500 font-semibold">(Accepted Terms & Conditions)</p>
            </div>
          ) : (
            <div className="space-y-0.5 text-[10.5px] text-slate-500 font-mono">
              <p>Verified by: HR Department</p>
              <p>Document Security ID: {payload.refNo}</p>
            </div>
          )}

          {/* Official Stamp & Signatory */}
          <div className="text-center space-y-0.5">
            <div className="h-11 flex items-center justify-center">
              <div className="w-18 h-10 border border-sky-300 rounded-lg bg-sky-50/50 flex items-center justify-center text-[8.5px] font-black text-sky-800 uppercase tracking-widest rotate-[-6deg] opacity-80 px-2">
                Official Seal
              </div>
            </div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {payload.authorizedSignatoryName}
            </p>
            <p className="text-[10px] font-bold text-slate-600">
              {payload.authorizedSignatoryTitle}
            </p>
            <p className="text-[9.5px] text-sky-700 font-semibold uppercase">
              {schoolName}
            </p>
          </div>
        </div>

        <div className="text-center text-[9px] text-slate-400 mt-4 pt-2 border-t border-slate-100 font-mono">
          This is an official document generated by {schoolName} ERP HR System &bull; Verification Link available via institutional registry
        </div>
      </div>
    </div>
  );
};
