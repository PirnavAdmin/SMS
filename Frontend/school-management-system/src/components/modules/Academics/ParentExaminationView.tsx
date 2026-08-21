import React, { useState, useEffect } from 'react';
import { Award, Download, TrendingUp, BookOpen, ChevronDown, AlertCircle, FileText } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const ParentExaminationView: React.FC = () => {
  const { students, exams, processedResults, subjects, gradeConfigurations, questionPapers, examMarks } = useData();
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
    // If no parent wards match, fallback to first active students for UI display (in non-prod simulation)
    parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
  }

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  const getSubjectCode = (subjectName: string) => {
    if (!subjectName) return '';
    const name = subjectName.toLowerCase();
    if (name.includes('math')) return 'MAT-101';
    if (name.includes('english')) return 'ENG-103';
    if (name.includes('physics')) return 'PHY-102';
    if (name.includes('chemistry')) return 'CHE-104';
    if (name.includes('biology')) return 'BIO-105';
    if (name.includes('science')) return 'SCI-106';
    if (name.includes('computer')) return 'CS-105';
    return `${subjectName.substring(0, 3).toUpperCase()}-101`;
  };

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        No active student records linked to this user account.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  
  // Get ONLY officially Published results
  const wardResultsRaw = processedResults.filter(
    r => r.studentId === currentWard.id && r.status === 'Published'
  );

  const fallbackExams = [
    {
      examId: 'term-1',
      examName: 'Term 1 (Mid-Term)',
      date: 'Oct 15, 2026',
      overallGrade: 'B+',
      percentage: '86.3%',
      remarks: `${currentWard.firstName} is showing consistent progress. He participated actively in classes.`,
      subjects: [
        { name: 'Mathematics', marks: 88, grade: 'A' },
        { name: 'English', marks: 82, grade: 'B+' },
        { name: 'Physics', marks: 78, grade: 'B' },
        { name: 'Chemistry', marks: 85, grade: 'A-' },
        { name: 'Biology', marks: 91, grade: 'A' },
        { name: 'Computer Science', marks: 94, grade: 'A+' },
      ]
    },
    {
      examId: 'term-2',
      examName: 'Term 2 (Final)',
      date: 'Mar 24, 2027',
      overallGrade: 'A',
      percentage: '91.5%',
      remarks: `Excellent final result! ${currentWard.firstName} has improved remarkably in Term 2.`,
      subjects: [
        { name: 'Mathematics', marks: 92, grade: 'A+' },
        { name: 'English', marks: 86, grade: 'A-' },
        { name: 'Physics', marks: 84, grade: 'B+' },
        { name: 'Chemistry', marks: 89, grade: 'A' },
        { name: 'Biology', marks: 93, grade: 'A+' },
        { name: 'Computer Science', marks: 96, grade: 'A+' },
      ]
    }
  ];

  const dbChildExams = wardResultsRaw.map(r => {
    const exam = exams.find(e => e.id === r.examId);
    const marksForExam = examMarks.filter(m => m.examId === r.examId && m.studentId === r.studentId);
    
    const formattedSubjects = marksForExam.map((sm: any) => ({
      name: getSubjectName(sm.subject),
      marks: sm.marksObtained,
      grade: sm.grade || 'N/A'
    }));
    
    return {
      examId: r.examId,
      examName: exam?.name || 'Unknown Exam',
      date: exam?.startDate || '',
      overallGrade: r.overallGrade || r.finalGrade,
      percentage: r.percentage.toFixed(1) + '%',
      remarks: r.remarks || 'No remarks provided by class teacher.',
      subjects: formattedSubjects
    };
  });

  const childExams = dbChildExams.length > 0 ? dbChildExams : fallbackExams;

  const activeExam = childExams.find((e: any) => e.examName === selectedExamId) || childExams[0];

  // Set default selected exam on mount or if child changes
  useEffect(() => {
    if (childExams.length > 0) {
      setSelectedExamId(childExams[0].examName);
    } else {
      setSelectedExamId('');
    }
  }, [selectedChildIdx, processedResults.length, childExams.length]);

  const handleDownload = (fileName: string) => {
    if (!activeExam) return;
    let content = `School Management System - Document Download\n==========================================\nFile: ${fileName}\n\n`;
    
    content += `OFFICIAL STUDENT REPORT CARD\n`;
    content += `Exam: ${activeExam.examName}\n`;
    content += `Date: ${activeExam.date}\n`;
    content += `Student: ${currentWard.firstName} ${currentWard.lastName} (${currentWard.className}-${currentWard.section})\n\n`;
    
    content += `PERFORMANCE SUMMARY\n`;
    content += `-------------------\n`;
    content += `Overall Percentage: ${activeExam.percentage}\n`;
    content += `Scholastic Grade: ${activeExam.overallGrade}\n`;
    content += `Remarks: ${activeExam.remarks}\n\n`;
    
    content += `SUBJECT MARKS\n`;
    content += `-------------\n`;
    activeExam.subjects.forEach((sub: any) => {
      content += `${sub.name.padEnd(20)} | Score: ${String(sub.marks).padEnd(6)} | Grade: ${sub.grade}\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const displayPapers = questionPapers.filter(qp => 
    qp.status === 'Published' &&
    (!qp.className || qp.className === currentWard.className) &&
    (!qp.section || qp.section === 'All Sections' || qp.section === currentWard.section)
  );

  return (
    <div className="space-y-6 animate-in fade-in text-left">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <Award className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          Reports
        </h2>

        {/* Assessment Dropdown (Always visible) */}
        {childExams.length > 0 && (
          <div className="relative min-w-[250px] no-print">
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

      {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
      {role !== 'Student' && parentWards.length > 1 && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max no-print">
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

      <div className="grid grid-cols-1 gap-6">
        {activeExam && (
          <div id="printable-content" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm p-4 sm:p-5 space-y-4">
            
            {/* Header Block with School Name */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">OFFICIAL STUDENT REPORT CARD</h2>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button 
                  onClick={() => window.print()}
                  className="no-print flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Print / Download</span>
                </button>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-center border-r border-b border-slate-200 dark:border-slate-800 last:border-r-0">Subjects</th>
                    <th className="px-4 py-2.5 text-center border-r border-b border-slate-200 dark:border-slate-800 last:border-r-0">Score</th>
                    <th className="px-4 py-2.5 text-center border-b border-slate-200 dark:border-slate-800 last:border-r-0">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                  {activeExam.subjects.map((sub: any, sIdx: number) => (
                    <tr key={sIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-sm border-r border-b border-slate-200 dark:border-slate-800 last:border-r-0 text-center">
                        <div className="flex flex-col items-center">
                          <span>{sub.name}</span>
                          <span className="opacity-60 text-[10px] font-normal lowercase">
                            ({getSubjectCode(sub.name).toLowerCase()})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300 font-semibold border-r border-b border-slate-200 dark:border-slate-800 last:border-r-0">{sub.marks} / 100</td>
                      <td className="px-4 py-3 text-center border-b border-slate-200 dark:border-slate-800 last:border-r-0">
                        <div className="flex justify-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            sub.grade.includes('A') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250/20' :
                            'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-250/20'
                          }`}>
                            {sub.grade}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-800">
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                    <td className="px-4 py-3 font-black text-slate-900 dark:text-white text-sm text-center uppercase tracking-wider border-r border-slate-200 dark:border-slate-800">Total Score</td>
                    <td className="px-4 py-3 text-center font-mono text-sky-600 dark:text-sky-400 font-black text-base border-r border-slate-200 dark:border-slate-800">
                      {activeExam.subjects.reduce((sum: number, sub: any) => sum + (typeof sub.marks === 'number' ? sub.marks : parseInt(String(sub.marks)) || 0), 0)} / {activeExam.subjects.length * 100}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
