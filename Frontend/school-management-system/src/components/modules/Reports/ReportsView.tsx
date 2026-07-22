import React from 'react';
import { BarChart3, Download, FileSpreadsheet, UserCheck, Users, DollarSign, CalendarCheck } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { ExportButton } from '../../common/ExportButton';

export const ReportsView: React.FC = () => {
  const { students, staff, feePayments, attendance, examMarks } = useData();

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-600" /> Reports & Analytics Hub
        </h2>
        <p className="text-xs text-slate-500">Generate executive summary reports, financial statement exports, and attendance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Master Report */}
        <div className="glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Student Directory Report</h3>
              <p className="text-xs text-slate-500">Contains {students.length} student records with guardian details & GPA</p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <ExportButton data={students} filename="student_master_report" />
          </div>
        </div>

        {/* Staff & Faculty Report */}
        <div className="glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Staff HR & Salary Report</h3>
              <p className="text-xs text-slate-500">Contains {staff.length} faculty members, salary structure & leave balances</p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <ExportButton data={staff} filename="staff_hr_report" />
          </div>
        </div>

        {/* Fee Payment Financial Report */}
        <div className="glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Financial Fee Ledger Report</h3>
              <p className="text-xs text-slate-500">Contains {feePayments.length} collection transactions & receipts</p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <ExportButton data={feePayments} filename="fee_financial_report" />
          </div>
        </div>

        {/* Exam Marks Performance */}
        <div className="glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Academic Examination Marks Report</h3>
              <p className="text-xs text-slate-500">Contains {examMarks.length} subject mark sheets & calculated grades</p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <ExportButton data={examMarks} filename="academic_exam_marks_report" />
          </div>
        </div>
      </div>
    </div>
  );
};
