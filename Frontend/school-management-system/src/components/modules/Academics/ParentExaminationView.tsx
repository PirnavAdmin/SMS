import React, { useState, useEffect } from 'react';
import { Award, Download, TrendingUp, BookOpen, ChevronDown, AlertCircle, FileText } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const ParentExaminationView: React.FC = () => {
  const { students, exams, processedResults, subjects, gradeConfigurations, questionPapers } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

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

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active wards found for your account.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  
  // Get real results from Context (Published or Locked only)
  const wardResultsRaw = processedResults.filter(r => r.studentId === currentWard.id && (r.status === 'Published' || r.status === 'Locked'));

  const staticFallbackExam = [{
    examName: 'Mid-Term Assessment 2026',
    date: '2026-09-15',
    overallGrade: 'A',
    percentage: '88.5%',
    remarks: 'Excellent performance. Keep it up!',
    subjects: [
      { name: 'Mathematics', marks: '92/100', grade: 'A1' },
      { name: 'Physics', marks: '85/100', grade: 'A2' },
      { name: 'Chemistry', marks: '88/100', grade: 'A2' },
      { name: 'English', marks: '89/100', grade: 'A2' }
    ]
  }];

  const childExamsRaw = wardResultsRaw.map(r => {
    const exam = exams.find(e => e.id === r.examId);
    return {
      examName: exam?.name || 'Unknown Exam',
      date: exam?.startDate || '',
      overallGrade: r.overallGrade || r.finalGrade,
      percentage: r.percentage.toFixed(1) + '%',
      remarks: r.remarks || 'No remarks provided by class teacher.',
      subjects: (r.subjectMarks || []).map((sm: any) => ({
        name: getSubjectName(sm.subjectId || sm.subject),
        marks: `${sm.marksObtained}/${sm.maxMarks}`,
        grade: sm.grade
      }))
    };
  });

  const childExams = childExamsRaw.length > 0 ? childExamsRaw : staticFallbackExam;

  useEffect(() => {
    if (childExams.length > 0) {
      setSelectedExamId(childExams[0].examName);
    } else {
      setSelectedExamId('');
    }
  }, [selectedChildIdx, processedResults.length]);

  const activeExam = childExams.find((e: any) => e.examName === selectedExamId);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-sky-500" /> Reports
        </h2>
        <p className="text-xs text-slate-500 mt-1">Review academic assessments and term reports</p>
      </div>

      {!hasMatchedWards && (
         <div className="bg-sky-50 border border-sky-200 text-sky-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
               <p className="font-bold">Demo Mode Active</p>
               <p>Your login email/phone ({user?.email}) did not match any guardian records in the database. Showing sample wards for demonstration.</p>
            </div>
         </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
        {role !== 'Student' && (
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max">
            {parentWards.map((ward, idx) => (
              <button
                key={ward.id}
                onClick={() => setSelectedChildIdx(idx)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedChildIdx === idx
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
              </button>
            ))}
          </div>
        )}

        {/* Assessment Dropdown */}
        {childExams.length > 0 && (
          <div className="relative min-w-[250px]">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer shadow-sm"
            >
              {childExams.map((exam: any, idx: number) => (
                <option key={idx} value={exam.examName}>
                  {exam.examName} ({exam.date})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeExam ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            
            {childExamsRaw.length === 0 && (
               <div className="bg-sky-50 p-3 text-sky-700 text-xs font-semibold text-center border-b border-sky-100">
                 Note: Displaying static sample data because no processed exam results were found for this student.
               </div>
            )}

            {/* Exam Header */}
            <div className="bg-sky-50 dark:bg-sky-900/10 p-6 sm:p-8 border-b border-sky-100 dark:border-sky-900/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-xs font-bold mb-3">
                  <BookOpen className="w-3.5 h-3.5" />
                  {activeExam.date}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {activeExam.examName}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Class Teacher's Remarks: {activeExam.remarks}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overall %</p>
                  <p className="text-2xl font-black text-sky-600 dark:text-sky-400 flex items-center justify-center gap-1">
                    {activeExam.percentage} <TrendingUp className="w-4 h-4" />
                  </p>
                </div>
                <div className="text-center px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scholastic Grade</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeExam.overallGrade}</p>
                </div>
                <button className="hidden sm:flex p-3 rounded-2xl bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-lg shadow-sky-600/20 items-center justify-center" title="Download Report Card">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 pl-6 sm:pl-8">Scholastic Area</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 pr-6 sm:pr-8 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {activeExam.subjects.map((sub: any, sIdx: number) => (
                    <tr key={sIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 pl-6 sm:pl-8 font-bold text-slate-900 dark:text-white text-sm">{sub.name}</td>
                      <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-300 font-semibold">{sub.marks}</td>
                      <td className="p-4 pr-6 sm:pr-8 text-right">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          sub.grade.includes('A') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          sub.grade.includes('B') ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400' :
                          sub.grade.includes('C') ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                        }`}>
                          {sub.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grading System Reference */}
            {gradeConfigurations && gradeConfigurations.length > 0 && (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Grading System Reference</h4>
                <div className="flex flex-wrap gap-2">
                  {gradeConfigurations.sort((a, b) => b.minPercent - a.minPercent).map(grade => (
                    <div key={grade.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
                      <span className="font-bold text-slate-900 dark:text-white w-6 text-center">{grade.gradeName}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500 font-mono">{grade.minPercent}-{grade.maxPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="sm:hidden p-4 border-t border-slate-200 dark:border-slate-800">
               <button className="w-full py-3 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-colors font-bold flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download Report Card
                </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 font-medium bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No assessment records found for this student.
          </div>
        )}

        {/* Published Question Papers for Student's Class */}
        {(() => {
          const publishedPapers = questionPapers.filter(qp => 
            qp.status === 'Published' &&
            (!qp.className || qp.className === currentWard.className) &&
            (!qp.section || qp.section === 'All Sections' || qp.section === currentWard.section)
          );

          if (publishedPapers.length === 0) return null;

          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm mt-6">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Published Examination Question Papers</h3>
                    <p className="text-[11px] text-slate-500">Official question papers released for {currentWard.className} ({currentWard.section})</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {publishedPapers.map(paper => (
                  <div key={paper.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 dark:text-white text-xs">{paper.paperTitle}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-bold text-sky-600 dark:text-sky-400">{paper.subject}</span>
                        <span>•</span>
                        <span>{paper.duration}</span>
                        <span>•</span>
                        <span>{paper.maxMarks} Marks</span>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Downloading '${paper.fileName}'...`)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
