import React, { useState } from 'react';
import { FileSpreadsheet, Download, Printer, Search, Filter } from 'lucide-react';
import { useData, AcademicClass } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const AcademicYearReportsView: React.FC = () => {
  const { students, studentEnrollments, academicYears, academicClasses } = useData();
  const { addToast } = useToast();

  const [reportType, setReportType] = useState<string>('Promotion Report');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');

  const [appliedFilters, setAppliedFilters] = useState({
    studentId: 'All',
    className: 'All'
  });

  const handleApply = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAppliedFilters({
      studentId: selectedStudentId,
      className: filterClass
    });
    addToast('success', 'Reports Generated', 'Filtered promotion registers updated.');
  };

  const showStudentSelect = reportType === 'Student Academic History';
  const showClassSelect = ['Class-wise Promotion', 'Failed Students'].includes(reportType);

  // Filtered queries
  const promotedEnrollments = studentEnrollments.filter(e => {
    if (e.resultStatus !== 'Promoted') return false;
    return true;
  });

  const failedEnrollments = studentEnrollments.filter(e => {
    if (e.resultStatus !== 'Failed') return false;
    if (appliedFilters.className !== 'All' && e.className !== appliedFilters.className) return false;
    return true;
  });

  const alumniList = students.filter(s => (s as any).status === 'Graduated' || (s as any).status === 'Alumni');

  // Selected student's promotion history list
  const selectedStudent = students.find(s => s.id === appliedFilters.studentId);
  const studentHistoryList = selectedStudent?.promotionHistory || [];

  const handleExport = () => {
    let headers = '';
    let rows = '';

    if (reportType === 'Promotion Report') {
      headers = 'Student Name,Admission No,Class,Section,Target Session,Date\n';
      rows = promotedEnrollments.map(e => `"${e.studentName}","${e.admissionNo}","${e.className}","${e.section}","${e.academicYear}","${e.promotionDate || 'N/A'}"`).join('\n');
    } else if (reportType === 'Failed Students') {
      headers = 'Student Name,Admission No,Class,Section,Session\n';
      rows = failedEnrollments.map(e => `"${e.studentName}","${e.admissionNo}","${e.className}","${e.section}","${e.academicYear}"`).join('\n');
    } else if (reportType === 'Alumni Report') {
      headers = 'Student Name,Admission No,Graduated Class,Phone,Remarks\n';
      rows = alumniList.map(s => `"${s.firstName} ${s.lastName}","${s.admissionNo}","${s.className}","${s.phone}","${s.remarks || 'Graduated'}"`).join('\n');
    } else if (reportType === 'Student Academic History' && selectedStudent) {
      headers = 'Academic Session,From Class,To Class,Date\n';
      rows = studentHistoryList.map(h => `"${h.academicYear}","${h.fromClass}","${h.toClass}","${h.date}"`).join('\n');
    } else {
      headers = 'Session Name,Start Date,End Date,Status\n';
      rows = academicYears.map(ay => `"${ay.name}","${ay.startDate}","${ay.endDate}","${ay.status}"`).join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Academic_${reportType.replace(/\s+/g, '_')}_Report.csv`;
    a.click();
    addToast('success', 'Report Exported');
  };

  return (
    <div className="space-y-6 text-xs animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-purple-600" /> Academic Reports Dashboard
          </h2>
          <p className="text-xs text-slate-500">Generate class promotion rosters, archive failed lists, query alumni directory, and inspect individual progress history</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 hover:bg-slate-200"><Printer className="w-4 h-4" /> Print</button>
          <button onClick={handleExport} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
      </div>

      {/* Selector & Filters */}
      <form onSubmit={handleApply} className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Report Type *</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-950 dark:text-purple-200 font-bold cursor-pointer"
            >
              <option value="Promotion Report">Promotion Registry Log</option>
              <option value="Failed Students">Failed / Detained Students</option>
              <option value="Alumni Report">Alumni Cohort Directory</option>
              <option value="Academic Year Summary">Academic Session Overview</option>
              <option value="Student Academic History">Student Progress History</option>
            </select>
          </div>

          {showStudentSelect && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold"
              >
                <option value="All">-- Select Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>)}
              </select>
            </div>
          )}

          {showClassSelect && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Class</label>
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold"
              >
                <option value="All">All Classes</option>
                {academicClasses.map((c: AcademicClass) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold shadow-md hover:bg-purple-500 flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> Generate Report</button>
        </div>
      </form>

      {/* Table Results */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
              {reportType === 'Promotion Report' ? (
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Target Session</th>
                  <th className="py-3 px-4">Promotion Date</th>
                </tr>
              ) : reportType === 'Failed Students' ? (
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Session</th>
                </tr>
              ) : reportType === 'Alumni Report' ? (
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Graduated Class</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Ceremony Remarks</th>
                </tr>
              ) : reportType === 'Student Academic History' ? (
                <tr>
                  <th className="py-3 px-4">Academic Session</th>
                  <th className="py-3 px-4">From Class</th>
                  <th className="py-3 px-4">To Class</th>
                  <th className="py-3 px-4">Transition Date</th>
                </tr>
              ) : (
                /* Academic Year Summary */
                <tr>
                  <th className="py-3 px-4">Session Year</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {reportType === 'Promotion Report' ? (
                promotedEnrollments.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">No promotions registered.</td></tr>
                ) : (
                  promotedEnrollments.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{e.studentName}</td>
                      <td className="py-3 px-4 font-mono">{e.admissionNo}</td>
                      <td className="py-3 px-4">{e.className}</td>
                      <td className="py-3 px-4">Section {e.section}</td>
                      <td className="py-3 px-4 text-purple-600 font-bold">{e.academicYear}</td>
                      <td className="py-3 px-4 font-mono">{e.promotionDate || 'N/A'}</td>
                    </tr>
                  ))
                )
              ) : reportType === 'Failed Students' ? (
                failedEnrollments.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No detained students found.</td></tr>
                ) : (
                  failedEnrollments.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{e.studentName}</td>
                      <td className="py-3 px-4 font-mono">{e.admissionNo}</td>
                      <td className="py-3 px-4">{e.className}</td>
                      <td className="py-3 px-4">Section {e.section}</td>
                      <td className="py-3 px-4 text-rose-500 font-bold">{e.academicYear}</td>
                    </tr>
                  ))
                )
              ) : reportType === 'Alumni Report' ? (
                alumniList.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No alumni logged.</td></tr>
                ) : (
                  alumniList.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</td>
                      <td className="py-3 px-4 font-mono">{s.admissionNo}</td>
                      <td className="py-3 px-4">{s.className}</td>
                      <td className="py-3 px-4 font-mono">{s.phone}</td>
                      <td className="py-3 px-4 italic text-slate-400">{s.remarks || 'Graduated'}</td>
                    </tr>
                  ))
                )
              ) : reportType === 'Student Academic History' ? (
                !selectedStudent ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400">Please select a student above to inspect.</td></tr>
                ) : studentHistoryList.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400">No promotion history for **{selectedStudent.firstName} {selectedStudent.lastName}** yet.</td></tr>
                ) : (
                  studentHistoryList.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{h.academicYear}</td>
                      <td className="py-3 px-4 text-slate-500">{h.fromClass} (Sec {h.fromSection})</td>
                      <td className="py-3 px-4 font-bold text-purple-600">{h.toClass} (Sec {h.toSection})</td>
                      <td className="py-3 px-4 font-mono">{h.date}</td>
                    </tr>
                  ))
                )
              ) : (
                academicYears.map(ay => (
                  <tr key={ay.id} className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{ay.name} Session</td>
                    <td className="py-3 px-4 font-mono">{ay.startDate}</td>
                    <td className="py-3 px-4 font-mono">{ay.endDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ay.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : (ay.status === 'Upcoming' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600')
                      }`}>{ay.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AcademicYearReportsView;
