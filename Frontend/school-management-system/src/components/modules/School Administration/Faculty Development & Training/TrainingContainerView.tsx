import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap, Award, Calendar, BookOpen, CheckCircle2, AlertTriangle,
  Plus, Search, Filter, Download, Printer, UserCheck, Users, FileText,
  Clock, MapPin, Sparkles, Star, ChevronRight, X, Eye, Edit, Trash2,
  FileCheck, ShieldCheck, Check, Layers, BarChart3, TrendingUp, HelpCircle,
  Megaphone, ExternalLink, Send, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { useData } from '../../../../context/DataContext';
import { useToast } from '../../../../context/ToastContext';
import { useAuth } from '../../../../context/AuthContext';
import {
  WorkshopTraining, EmployeeAssessment, IssuedCertificate,
  TrainingCategory, AssessmentType, AssessmentCategory, AssessmentMode, TrainingParticipant, AssessmentResult, Staff
} from '../../../../types';

export const TrainingContainerView: React.FC = () => {
  const {
    staff, workshops, addWorkshop, updateWorkshop, deleteWorkshop, markWorkshopAttendance, submitWorkshopFeedback,
    employeeAssessments, addAssessment, updateAssessment, deleteAssessment, saveAssessmentResults,
    issuedCertificates, issueCertificate, reissueCertificate, logActivity, fetchFacultyTrainingData
  } = useData();

  useEffect(() => {
    if (fetchFacultyTrainingData) {
      fetchFacultyTrainingData();
    }
  }, [fetchFacultyTrainingData]);

  const { addToast } = useToast();
  const { role, selectedBranch } = useAuth();
  const userRole = (role || '').toLowerCase();
  const canManageTraining = userRole.includes('admin') || userRole.includes('principal') || userRole.includes('director') || userRole.includes('coordinator') || userRole.includes('librarian') || userRole.includes('staff');

  // Active Sub-Tab: 'dashboard' | 'workshops' | 'assessments' | 'certificates' | 'reports' | 'profile-view'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workshops' | 'assessments' | 'certificates' | 'reports' | 'profile-view'>('dashboard');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Selected Employee for Profile Professional Development View
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || 'STF-101');

  // Modals
  const [isAddWorkshopModalOpen, setIsAddWorkshopModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedWorkshopForAttendance, setSelectedWorkshopForAttendance] = useState<WorkshopTraining | null>(null);

  const [isAddAssessmentModalOpen, setIsAddAssessmentModalOpen] = useState(false);
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);
  const [selectedAssessmentForEvaluation, setSelectedAssessmentForEvaluation] = useState<EmployeeAssessment | null>(null);

  const [selectedCertificateForPreview, setSelectedCertificateForPreview] = useState<IssuedCertificate | null>(null);

  // Workshop Form State
  const [workshopForm, setWorkshopForm] = useState({
    workshopName: '',
    category: 'Faculty Development Program (FDP)' as TrainingCategory,
    type: 'Internal' as 'Internal' | 'External',
    trainerName: '',
    organization: 'Pirnav Schools Professional Cell',
    branch: 'Main Campus',
    department: 'Academics',
    applicableDesignation: 'All Staff',
    venue: 'Main Auditorium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:30 AM',
    endTime: '03:30 PM',
    capacity: 50,
    description: '',
    targetRoleType: 'Teaching Staff' as 'Teaching Staff' | 'Non-Teaching Staff'
  });

  // Participant Filter for Workshop Creation
  const [participantFilters, setParticipantFilters] = useState({
    branch: 'All',
    department: 'All',
    designation: 'All',
    subject: 'All'
  });
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // 2-Step Assessment Scheduling Wizard State
  const [assessmentWizardStep, setAssessmentWizardStep] = useState<1 | 2>(1);

  const [wizardStep1, setWizardStep1] = useState({
    assessmentName: '',
    assessmentType: '' as any,
    category: '' as any,
    description: '',
    totalMarks: 100,
    passingMarks: 40,
    gradingScheme: 'Letter Grade' as 'Letter Grade' | 'Percentage' | 'Pass/Fail',
    instructions: ''
  });

  const [wizardStep2, setWizardStep2] = useState({
    targetEmployeeType: 'Teaching Staff' as 'Teaching Staff' | 'Non-Teaching Staff' | 'Both',
    academicYear: '2025-2026',
    branch: 'Main Campus',
    department: 'All',
    designation: 'All',
    subject: 'All',
    employmentType: 'Permanent',
    experienceRange: 'All',
    assessmentDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    venue: '',
    mode: 'Offline' as AssessmentMode,
    evaluatorName: '',
    coEvaluatorName: '',
    options: {
      notifyParticipants: true,
      addToCalendar: true,
      allowReassessment: false,
      publishImmediately: true,
      generateCertificatesOnCompletion: true
    }
  });

  const handleOpenCreateAssessmentModal = () => {
    setWizardStep1({
      assessmentName: '',
      assessmentType: '' as any,
      category: '' as any,
      description: '',
      totalMarks: 100,
      passingMarks: 40,
      gradingScheme: 'Letter Grade' as any,
      instructions: ''
    });
    setWizardStep2({
      targetEmployeeType: 'Teaching Staff',
      academicYear: '2025-2026',
      branch: 'Main Campus',
      department: 'All',
      designation: 'All',
      subject: 'All',
      employmentType: 'Permanent',
      experienceRange: 'All',
      assessmentDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      venue: '',
      mode: 'Offline',
      evaluatorName: '',
      coEvaluatorName: '',
      options: {
        notifyParticipants: true,
        addToCalendar: true,
        allowReassessment: false,
        publishImmediately: true,
        generateCertificatesOnCompletion: true
      }
    });
    setSelectedAssessmentCandidateIds([]);
    setAssessmentWizardStep(1);
    setIsAddAssessmentModalOpen(true);
  };

  const [assessmentCandidateSearch, setAssessmentCandidateSearch] = useState('');
  const [selectedAssessmentCandidateIds, setSelectedAssessmentCandidateIds] = useState<string[]>([]);

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    staff.forEach(s => { if (s.department) depts.add(s.department); });
    return Array.from(depts);
  }, [staff]);

  const availableDesignations = useMemo(() => {
    const desigs = new Set<string>();
    staff.forEach(s => { if (s.designation) desigs.add(s.designation); });
    return Array.from(desigs);
  }, [staff]);

  // Matching Candidates for Assessment Wizard Step 2
  const matchingAssessmentCandidates = useMemo(() => {
    const list = staff.filter(s => {
      const isTeacherRole = s.role === 'Teacher' || s.role === 'Teaching' || (s as any).employeeType === 'Teaching Staff' ||
        (s.department || '').toLowerCase().includes('teach') || (s.department || '').toLowerCase().includes('academic') ||
        (s.designation || '').toLowerCase().includes('teacher') || (s.designation || '').toLowerCase().includes('faculty') ||
        !s.role;

      const matchesRole = (wizardStep2.targetEmployeeType as string) === 'Both' || (wizardStep2.targetEmployeeType as string) === 'All Staff' ||
        (wizardStep2.targetEmployeeType === 'Teaching Staff' ? isTeacherRole : !isTeacherRole);

      const matchesBranch = wizardStep2.branch === 'All' || wizardStep2.branch === 'Main Campus' || !s.branch || s.branch === 'All Branches' ||
        s.branch.toLowerCase() === wizardStep2.branch.toLowerCase();

      const matchesDept = wizardStep2.department === 'All' || wizardStep2.department === 'All Departments' || !wizardStep2.department ||
        (wizardStep2.department === 'Academics' ? (isTeacherRole || s.department === 'Academics' || s.department === 'Teaching' || s.department === 'Science' || s.department === 'Mathematics' || s.department === 'English') : (s.department?.toLowerCase() === wizardStep2.department?.toLowerCase()));

      const matchesDesig = wizardStep2.designation === 'All' || wizardStep2.designation === 'All Designations' || !wizardStep2.designation ||
        (s.designation?.toLowerCase() === wizardStep2.designation?.toLowerCase());

      const staffSubject = (s as any).subject || s.qualification || '';
      const matchesSubject = wizardStep2.subject === 'All' || !staffSubject || staffSubject.toLowerCase() === wizardStep2.subject.toLowerCase();
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.department} ${s.designation} ${s.id}`.toLowerCase().includes(assessmentCandidateSearch.toLowerCase());

      return matchesRole && matchesBranch && matchesDept && matchesDesig && matchesSubject && matchesSearch;
    });
    return list.length > 0 ? list : staff;
  }, [staff, wizardStep2, assessmentCandidateSearch]);

  // Sync selected candidates when filters change
  React.useEffect(() => {
    setSelectedAssessmentCandidateIds(matchingAssessmentCandidates.map(s => s.id));
  }, [matchingAssessmentCandidates]);

  // Evaluation Form Results State
  const [evaluationScores, setEvaluationScores] = useState<Record<string, { marksObtained: number; remarks: string }>>({});

  // ==========================================
  // FILTERED DATASETS
  // ==========================================
  const filteredWorkshops = useMemo(() => {
    return workshops.filter(w => {
      const matchesSearch = w.workshopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = departmentFilter === 'All' || departmentFilter === 'All Departments' || w.department === departmentFilter || !w.department;
      return matchesSearch && matchesDept;
    });
  }, [workshops, searchQuery, departmentFilter]);

  const filteredAssessments = useMemo(() => {
    return employeeAssessments.filter(a => {
      const matchesSearch = a.assessmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assessmentType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = departmentFilter === 'All' || departmentFilter === 'All Departments' || a.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [employeeAssessments, searchQuery, departmentFilter]);

  const filteredCertificates = useMemo(() => {
    return issuedCertificates.filter(c => {
      const matchesSearch = c.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [issuedCertificates, searchQuery]);

  // Compute Dashboard Metrics
  const metrics = useMemo(() => {
    const upcomingWorkshops = workshops.filter(w => w.status === 'Scheduled').length;
    const upcomingAssessments = employeeAssessments.filter(a => a.status === 'Scheduled').length;
    const ongoingPrograms = workshops.filter(w => w.status === 'Ongoing').length;
    const completedPrograms = workshops.filter(w => w.status === 'Completed').length;
    const totalParticipantsCount = workshops.reduce((acc, w) => acc + w.participants.length, 0);
    const totalCertificates = issuedCertificates.length;
    const pendingAssessments = employeeAssessments.filter(a => a.status === 'Scheduled' || a.status === 'In Progress').length;

    // Average Assessment Score
    let totalPctSum = 0;
    let totalResultsCount = 0;
    employeeAssessments.forEach(a => {
      a.results.forEach(r => {
        totalPctSum += r.percentage;
        totalResultsCount++;
      });
    });
    const avgScore = totalResultsCount > 0 ? Math.round(totalPctSum / totalResultsCount) : 0;

    return {
      upcomingWorkshops, upcomingAssessments, ongoingPrograms, completedPrograms,
      totalParticipantsCount, totalCertificates, pendingAssessments, avgScore
    };
  }, [workshops, employeeAssessments, issuedCertificates]);

  // Matching Employee Selection List
  const candidateEmployees = useMemo(() => {
    const list = staff.filter(s => {
      const isTeacherRole = s.role === 'Teacher' || s.role === 'Teaching' || (s as any).employeeType === 'Teaching Staff' ||
        (s.department || '').toLowerCase().includes('teach') || (s.department || '').toLowerCase().includes('academic') ||
        (s.designation || '').toLowerCase().includes('teacher') || (s.designation || '').toLowerCase().includes('faculty') ||
        !s.role;

      const matchesRole = (workshopForm.targetRoleType as string) === 'All Staff' || (workshopForm.targetRoleType as string) === 'Both' ||
        (workshopForm.targetRoleType === 'Teaching Staff' ? isTeacherRole : !isTeacherRole);

      const matchesBranch = participantFilters.branch === 'All' || participantFilters.branch === 'Main Campus' || !s.branch || s.branch === 'All Branches' ||
        s.branch.toLowerCase() === participantFilters.branch.toLowerCase();

      const matchesDept = participantFilters.department === 'All' || participantFilters.department === 'All Departments' ||
        s.department?.toLowerCase() === participantFilters.department?.toLowerCase();

      const matchesDesig = participantFilters.designation === 'All' || participantFilters.designation === 'All Designations' ||
        s.designation?.toLowerCase() === participantFilters.designation?.toLowerCase();

      return matchesRole && matchesBranch && matchesDept && matchesDesig;
    });
    return list.length > 0 ? list : staff;
  }, [staff, workshopForm.targetRoleType, participantFilters]);

  // Auto-sync selected employees when candidateEmployees change or modal opens
  React.useEffect(() => {
    if (isAddWorkshopModalOpen) {
      setSelectedEmployeeIds(candidateEmployees.map(s => s.id));
    }
  }, [isAddWorkshopModalOpen, candidateEmployees]);

  // Handle Select All Employees
  const handleSelectAllCandidates = () => {
    if (selectedEmployeeIds.length === candidateEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(candidateEmployees.map(s => s.id));
    }
  };

  // Workshop Creation Submit
  const handleAddWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshopForm.workshopName.trim()) {
      addToast('warning', 'Validation Error', 'Please enter workshop name.');
      return;
    }

    const assignedParticipants: TrainingParticipant[] = selectedEmployeeIds.map(empId => {
      const s = staff.find(st => st.id === empId);
      return {
        employeeId: empId,
        employeeName: s ? `${s.firstName} ${s.lastName}` : 'Staff Member',
        employeeRole: s?.role === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff',
        department: s?.department || 'General',
        designation: s?.designation || 'Staff',
        branch: s?.branch || 'Main Campus',
        attendanceStatus: 'Pending'
      };
    });

    const newWks = addWorkshop({
      workshopName: workshopForm.workshopName.trim(),
      category: workshopForm.category,
      type: workshopForm.type,
      trainerName: workshopForm.trainerName || 'External Expert',
      organization: workshopForm.organization || 'Training Agency',
      branch: workshopForm.branch,
      department: workshopForm.department,
      applicableDesignation: workshopForm.applicableDesignation,
      venue: workshopForm.venue,
      startDate: workshopForm.startDate,
      endDate: workshopForm.endDate,
      startTime: workshopForm.startTime,
      endTime: workshopForm.endTime,
      capacity: Number(workshopForm.capacity),
      description: workshopForm.description,
      status: 'Scheduled',
      participants: assignedParticipants
    });

    addToast('success', 'Workshop Created', `Created workshop '${newWks.workshopName}' & notified ${assignedParticipants.length} employees.`);
    setIsAddWorkshopModalOpen(false);
    setSelectedEmployeeIds([]);
  };

  // Attendance Submission Submit
  const handleSaveAttendance = (workshopId: string) => {
    if (!selectedWorkshopForAttendance) return;
    markWorkshopAttendance(workshopId, selectedWorkshopForAttendance.participants.map(p => ({
      employeeId: p.employeeId,
      status: p.attendanceStatus === 'Pending' ? 'Present' : p.attendanceStatus
    })));

    addToast('success', 'Attendance Recorded', `Attendance and completion status updated for '${selectedWorkshopForAttendance.workshopName}'.`);
    setIsAttendanceModalOpen(false);
    setSelectedWorkshopForAttendance(null);
  };

  // Assessment Wizard Step 1 Validation & Proceed
  const handleProceedToStep2 = () => {
    if (!wizardStep1.assessmentName.trim()) {
      addToast('warning', 'Validation Error', 'Assessment Name is mandatory.');
      return;
    }
    if (!wizardStep1.assessmentType) {
      addToast('warning', 'Validation Error', 'Please select Assessment Type.');
      return;
    }
    if (!wizardStep1.category) {
      addToast('warning', 'Validation Error', 'Please select Assessment Category.');
      return;
    }
    if (wizardStep1.totalMarks <= 0) {
      addToast('warning', 'Validation Error', 'Total Marks must be greater than zero.');
      return;
    }
    if (wizardStep1.passingMarks > wizardStep1.totalMarks) {
      addToast('warning', 'Validation Error', 'Passing Marks cannot exceed Total Marks.');
      return;
    }
    setAssessmentWizardStep(2);
  };

  // Final Assessment Scheduling Submission
  const handleScheduleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssessmentCandidateIds.length === 0) {
      addToast('warning', 'No Participants Selected', 'Please select at least one employee for the assessment.');
      return;
    }

    const assignedResults: AssessmentResult[] = selectedAssessmentCandidateIds.map(empId => {
      const s = staff.find(st => st.id === empId);
      return {
        employeeId: empId,
        employeeName: s ? `${s.firstName} ${s.lastName}` : 'Staff Member',
        department: s?.department || 'Academics',
        designation: s?.designation || 'Staff',
        branch: s?.branch || wizardStep2.branch || 'Main Campus',
        marksObtained: 0,
        totalMarks: Number(wizardStep1.totalMarks),
        percentage: 0,
        grade: 'F',
        result: 'Pending'
      };
    });

    const newAsm = addAssessment({
      assessmentName: wizardStep1.assessmentName.trim(),
      assessmentType: wizardStep1.assessmentType,
      category: wizardStep1.category,
      description: wizardStep1.description,
      gradingScheme: wizardStep1.gradingScheme,
      department: wizardStep2.department,
      applicableDesignation: wizardStep2.designation,
      branch: wizardStep2.branch,
      academicYear: wizardStep2.academicYear,
      targetEmployeeType: wizardStep2.targetEmployeeType,
      date: wizardStep2.assessmentDate,
      startTime: wizardStep2.startTime,
      endTime: wizardStep2.endTime,
      durationMinutes: 120,
      venue: wizardStep2.venue,
      mode: wizardStep2.mode,
      totalMarks: Number(wizardStep1.totalMarks),
      passingMarks: Number(wizardStep1.passingMarks),
      instructions: wizardStep1.instructions,
      evaluatorName: wizardStep2.evaluatorName,
      coEvaluatorName: wizardStep2.coEvaluatorName,
      options: wizardStep2.options,
      status: 'Scheduled',
      results: assignedResults
    });

    addToast('success', 'Assessment Scheduled Successfully!', `Created '${newAsm.assessmentName}' and assigned ${assignedResults.length} participants.`);
    setIsAddAssessmentModalOpen(false);
    setAssessmentWizardStep(1);
  };

  // Save Assessment Evaluation
  const handleSaveEvaluation = (assessmentId: string) => {
    if (!selectedAssessmentForEvaluation) return;

    const updatedResults: AssessmentResult[] = selectedAssessmentForEvaluation.results.map(r => {
      const scoreData = evaluationScores[r.employeeId];
      const marksObtained = scoreData ? Number(scoreData.marksObtained) : r.marksObtained;
      const total = selectedAssessmentForEvaluation.totalMarks;
      const pct = Math.round((marksObtained / total) * 100);
      const isPass = marksObtained >= selectedAssessmentForEvaluation.passingMarks;

      let grade = 'F';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B+';
      else if (pct >= 60) grade = 'B';
      else if (pct >= 50) grade = 'C';

      return {
        ...r,
        marksObtained,
        percentage: pct,
        grade,
        result: isPass ? 'Pass' : 'Fail',
        evaluatorRemarks: scoreData?.remarks || 'Evaluated successfully.',
        evaluatedDate: new Date().toISOString().split('T')[0]
      };
    });

    saveAssessmentResults(assessmentId, updatedResults);
    addToast('success', 'Results Evaluated', `Saved assessment evaluation and auto-issued certificates to passed candidates.`);
    setIsEvaluateModalOpen(false);
    setSelectedAssessmentForEvaluation(null);
  };

  // CSV Export for Reports
  const handleExportReportCSV = () => {
    const headers = ['Category,Name,Type,Branch,Department,Date,Status,Participants/Candidates,Pass Rate / Attendance'];
    const workshopRows = workshops.map(w =>
      `"Workshop","${w.workshopName}","${w.category}","${w.branch}","${w.department || 'All'}","${w.startDate}","${w.status}","${w.participants.length}","${w.attendancePct || 0}%"`
    );
    const assessmentRows = employeeAssessments.map(a =>
      `"Assessment","${a.assessmentName}","${a.assessmentType}","${a.branch}","${a.department}","${a.date}","${a.status}","${a.results.length}","Evaluated"`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...workshopRows, ...assessmentRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Training_Assessments_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Exported Training & Assessment Reports to CSV.');
  };

  // Active Employee Profile Professional Development Records
  const selectedStaffObj = staff.find(s => s.id === selectedStaffId) || staff[0];
  const staffWorkshops = workshops.filter(w => w.participants.some(p => p.employeeId === selectedStaffObj?.id));
  const staffAssessments = employeeAssessments.filter(a => a.results.some(r => r.employeeId === selectedStaffObj?.id));
  const staffCertificates = issuedCertificates.filter(c => c.employeeId === selectedStaffObj?.id);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Module Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Faculty Development & Training
          </h2>
          </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReportCSV}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
          </button>

          {canManageTraining && (
            <>
              <button
                onClick={() => handleOpenCreateAssessmentModal()}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Schedule Evaluation
              </button>

              <button
                onClick={() => setIsAddWorkshopModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Create Workshop / FDP
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 w-full border border-slate-200/60 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'dashboard' ? 'bg-white dark:bg-slate-950 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Dashboard
        </button>

        <button
          onClick={() => setActiveTab('workshops')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'workshops' ? 'bg-white dark:bg-slate-950 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-500" /> Workshops & FDPs ({workshops.length})
        </button>

        <button
          onClick={() => setActiveTab('assessments')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'assessments' ? 'bg-white dark:bg-slate-950 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-sky-500" /> Competency Evaluations ({employeeAssessments.length})
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'certificates' ? 'bg-white dark:bg-slate-950 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" /> Earned Certificates ({issuedCertificates.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-white dark:bg-slate-950 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-500" /> Development Reports
        </button>

        <button
          onClick={() => setActiveTab('profile-view')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'profile-view' ? 'bg-white dark:bg-slate-950 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-sky-500" /> Staff Profiles
        </button>
      </div>

      {/* SUB-TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase text-sky-600">Upcoming Workshops</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics.upcomingWorkshops}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase text-sky-600">Upcoming Tests</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics.upcomingAssessments}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase text-sky-600">Ongoing Programs</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics.ongoingPrograms}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase text-emerald-600">Completed FDPs</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics.completedPrograms}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase text-amber-600">Participants</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics.totalParticipantsCount}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase text-rose-600">Certificates Issued</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics.totalCertificates}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase text-teal-600">Avg Score</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics.avgScore}%</p>
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Training & Workshops Widget */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-500" /> Scheduled Training Programs & FDPs
                </h3>
                <button onClick={() => setActiveTab('workshops')} className="text-xs font-bold text-brand-600 hover:underline">View Catalog</button>
              </div>

              <div className="space-y-3">
                {workshops.map(w => (
                  <div key={w.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-200">
                        {w.category}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white mt-1">{w.workshopName}</h4>
                      <p className="text-[10px] text-slate-500">Trainer: {w.trainerName} ({w.organization}) • Venue: {w.venue}</p>
                    </div>
                    <span className="font-mono font-extrabold text-[11px] text-slate-700 dark:text-slate-300">
                      {w.startDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competency Assessments Radar */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-sky-500" /> Employee Competency Assessments
                </h3>
                <button onClick={() => setActiveTab('assessments')} className="text-xs font-bold text-sky-600 hover:underline">View All</button>
              </div>

              <div className="space-y-3">
                {employeeAssessments.map(a => (
                  <div key={a.id} className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-200">
                        {a.assessmentType}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white mt-1">{a.assessmentName}</h4>
                      <p className="text-[10px] text-slate-500">Evaluator: {a.evaluatorName} • Dept: {a.department}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sky-600 block">{a.date}</span>
                      <span className="text-[10px] text-slate-400">{a.results.length} Candidates</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: WORKSHOPS & TRAINING */}
      {activeTab === 'workshops' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-500" /> Workshops & Training Catalog
              </h3>
            </div>
            <button
              onClick={() => setIsAddWorkshopModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Create Workshop
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkshops.map(w => (
              <div key={w.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-200">
                    {w.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedWorkshopForAttendance(w);
                        setIsAttendanceModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] hover:bg-emerald-100 flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" /> Attendance ({w.attendancePct || 0}%)
                    </button>
                    <button onClick={() => deleteWorkshop(w.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{w.workshopName}</h4>
                  <p className="text-xs text-slate-500 mt-1">{w.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t">
                  <span>📅 <strong>Dates:</strong> {w.startDate} - {w.endDate}</span>
                  <span>⏰ <strong>Time:</strong> {w.startTime} - {w.endTime}</span>
                  <span>👤 <strong>Trainer:</strong> {w.trainerName} ({w.organization})</span>
                  <span>📍 <strong>Venue:</strong> {w.venue}</span>
                  <span>🏢 <strong>Branch:</strong> {w.branch}</span>
                  <span>👥 <strong>Enrolled:</strong> {w.participants.length} Employees</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-500" /> Employee Competency Assessments
              </h3>
            </div>
            <button
              onClick={() => handleOpenCreateAssessmentModal()}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Schedule Assessment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssessments.map(a => (
              <div key={a.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-200">
                    {a.assessmentType}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedAssessmentForEvaluation(a);
                        // pre-fill scores
                        const initialScores: Record<string, { marksObtained: number; remarks: string }> = {};
                        a.results.forEach(r => {
                          initialScores[r.employeeId] = { marksObtained: r.marksObtained, remarks: r.evaluatorRemarks || '' };
                        });
                        setEvaluationScores(initialScores);
                        setIsEvaluateModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-bold text-[10px] hover:bg-sky-100 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Record Results
                    </button>
                    <button onClick={() => deleteAssessment(a.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{a.assessmentName}</h4>
                  <p className="text-xs text-slate-500 mt-1">{a.instructions}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t">
                  <span>📅 <strong>Date:</strong> {a.date} ({a.durationMinutes} min)</span>
                  <span>💯 <strong>Passing Marks:</strong> {a.passingMarks} / {a.totalMarks}</span>
                  <span>👤 <strong>Evaluator:</strong> {a.evaluatorName}</span>
                  <span>🏢 <strong>Branch:</strong> {a.branch}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Issued Employee Certificates Registry
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] text-slate-400 font-extrabold">
                  <tr>
                    <th className="p-3">Cert No</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Program Name</th>
                    <th className="p-3">Program Type</th>
                    <th className="p-3">Completion Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCertificates.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-600">{c.certificateNumber}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{c.employeeName}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{c.programName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                          {c.programType}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{c.completionDate}</td>
                      <td className="p-3 font-bold text-emerald-600">{c.status}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedCertificateForPreview(c)}
                          className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg text-[10px] hover:bg-amber-500"
                        >
                          Preview & Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" /> Executive Training & Competency Reports
              </h3>
            </div>
            <button onClick={handleExportReportCSV} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">Export Report</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Workshop Participation Summary</h4>
              <div className="space-y-2 text-xs">
                {workshops.map(w => (
                  <div key={w.id} className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span>{w.workshopName}</span>
                    <span className="font-bold">{w.participants.length} Enrolled ({w.attendancePct || 0}% Attended)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Assessment Pass / Fail Breakdown</h4>
              <div className="space-y-2 text-xs">
                {employeeAssessments.map(a => {
                  const passCount = a.results.filter(r => r.result === 'Pass').length;
                  return (
                    <div key={a.id} className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span>{a.assessmentName}</span>
                      <span className="font-bold text-emerald-600">{passCount} / {a.results.length} Passed</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: STAFF PROFILES PROFESSIONAL DEVELOPMENT SHOWCASE */}
      {activeTab === 'profile-view' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-500" /> Employee Profile Professional Development View
              </h3>
            </div>

            <select
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border font-bold text-xs"
            >
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.department || s.role})</option>
              ))}
            </select>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <img src={selectedStaffObj?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-brand-500" />
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedStaffObj?.firstName} {selectedStaffObj?.lastName}</h3>
                <p className="text-xs text-slate-500">{selectedStaffObj?.designation} • {selectedStaffObj?.department} Department ({selectedStaffObj?.branch})</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Workshops Completed */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Workshops Attended</h4>
                <div className="space-y-2">
                  {staffWorkshops.map(w => (
                    <div key={w.id} className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{w.workshopName}</p>
                      <p className="text-[10px] text-sky-600 font-bold mt-1">Status: Completed • {w.startDate}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competency Assessments */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Competency Assessments</h4>
                <div className="space-y-2">
                  {staffAssessments.map(a => {
                    const res = a.results.find(r => r.employeeId === selectedStaffObj?.id);
                    return (
                      <div key={a.id} className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs">
                        <p className="font-bold text-slate-900 dark:text-white">{a.assessmentName}</p>
                        <p className="text-[10px] font-bold text-sky-600 mt-1">Score: {res?.percentage || 0}% • {res?.result}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Earned Certificates */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Earned Certificates</h4>
                <div className="space-y-2">
                  {staffCertificates.map(c => (
                    <div key={c.id} className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{c.programName}</p>
                        <p className="text-[10px] font-mono text-amber-600">{c.certificateNumber}</p>
                      </div>
                      <button onClick={() => setSelectedCertificateForPreview(c)} className="px-2 py-1 bg-amber-600 text-white rounded text-[9px] font-bold">Download</button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CREATE WORKSHOP MODAL */}
      {isAddWorkshopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-600" /> Create Employee Workshop / FDP
              </h3>
              <button onClick={() => setIsAddWorkshopModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Quick Presets:</span>
              {[
                { title: 'AI & Machine Learning Tools in Modern Education', category: 'AI Training', trainer: 'Dr. Vikramaditya Sharma', org: 'EdTech Innovations Institute', venue: 'Smart Audio-Visual Lab 1' },
                { title: 'POCSO & Child Safety Awareness Training', category: 'POCSO Awareness', trainer: 'Adv. Meenakshi Sundaram', org: 'National Child Rights Protection Forum', venue: 'Main Auditorium' },
                { title: 'CBSE NEP 2020 Pedagogical Alignment Workshop', category: 'Faculty Development Program (FDP)', trainer: 'Prof. V. K. Mehta', org: 'CBSE Academic Directorate', venue: 'Conference Hall A' },
                { title: 'Teacher Wellness, Resilience & Stress Management', category: 'Leadership Training', trainer: 'Dr. Sunita Rao', org: 'Mindfulness & Wellness Cell', venue: 'Seminar Hall 2' }
              ].map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setWorkshopForm({
                      ...workshopForm,
                      workshopName: preset.title,
                      category: preset.category as any,
                      trainerName: preset.trainer,
                      organization: preset.org,
                      venue: preset.venue
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800 text-[10px] font-bold whitespace-nowrap cursor-pointer shrink-0"
                >
                  + {preset.category}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddWorkshopSubmit} className="flex-1 overflow-y-auto space-y-3 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div>
                <label className="block font-bold text-slate-900 dark:text-white mb-1">Workshop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Tools in Education & Digital Lesson Planning"
                  value={workshopForm.workshopName}
                  onChange={e => setWorkshopForm({ ...workshopForm, workshopName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Category *</label>
                  <select
                    value={workshopForm.category}
                    onChange={e => setWorkshopForm({ ...workshopForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
                  >
                    <option value="Faculty Development Program (FDP)">Faculty Development Program (FDP)</option>
                    <option value="Subject Training">Subject Training</option>
                    <option value="Teaching Methodology">Teaching Methodology</option>
                    <option value="Classroom Management">Classroom Management</option>
                    <option value="Smart Classroom Training">Smart Classroom Training</option>
                    <option value="ERP Training">ERP Training</option>
                    <option value="AI Training">AI Training</option>
                    <option value="Leadership Training">Leadership Training</option>
                    <option value="POCSO Awareness">POCSO Awareness</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Target Role Type *</label>
                  <select
                    value={workshopForm.targetRoleType}
                    onChange={e => setWorkshopForm({ ...workshopForm, targetRoleType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
                  >
                    <option value="Teaching Staff">Teaching Staff</option>
                    <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                    <option value="All Staff">All Staff (Both)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Employee Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2 font-semibold">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Matching Employee Participants ({selectedEmployeeIds.length} of {candidateEmployees.length} Selected)
                  </span>
                  {selectedEmployeeIds.length > 0 && (
                    <button type="button" onClick={() => setSelectedEmployeeIds([])} className="text-rose-600 text-[11px] font-bold hover:underline">
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Candidate Selection Dropdown Menu */}
                <select
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) return;
                    if (val === 'SELECT_ALL') {
                      setSelectedEmployeeIds(candidateEmployees.map(s => s.id));
                    } else if (val === 'DESELECT_ALL') {
                      setSelectedEmployeeIds([]);
                    } else {
                      if (!selectedEmployeeIds.includes(val)) {
                        setSelectedEmployeeIds([...selectedEmployeeIds, val]);
                      } else {
                        setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== val));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer outline-none hover:border-sky-500 shadow-xs"
                >
                  <option value="">Select Employee from Dropdown...</option>
                  <optgroup label="⚡ Selection Actions">
                    <option value="SELECT_ALL">Select All Employees ({candidateEmployees.length})</option>
                    <option value="DESELECT_ALL">Deselect All Employees</option>
                  </optgroup>
                  <optgroup label="👥 Available Staff Members">
                    {candidateEmployees.map(emp => {
                      const isSelected = selectedEmployeeIds.includes(emp.id);
                      return (
                        <option key={emp.id} value={emp.id}>
                          {isSelected ? '✓ [Selected] ' : '+ [Add] '} {emp.firstName} {emp.lastName} — {emp.designation || emp.role} ({emp.department || 'Academics'})
                        </option>
                      );
                    })}
                  </optgroup>
                </select>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border rounded-xl p-1 bg-white/50 dark:bg-slate-900/50">
                  {candidateEmployees.length === 0 ? (
                    <div className="p-3 text-center text-xs font-bold text-slate-400">
                      No staff members found matching target role. Try selecting "All Staff" above.
                    </div>
                  ) : (
                    candidateEmployees.map(emp => (
                      <label key={emp.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedEmployeeIds.includes(emp.id) ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedEmployeeIds.includes(emp.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                              else setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.id));
                            }}
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{emp.designation || emp.role} • {emp.department || 'Academics'}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

            </form>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setIsAddWorkshopModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" onClick={handleAddWorkshopSubmit} className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl shadow-md">Create & Notify Employees</button>
            </div>
          </div>
        </div>
      )}

      {/* SCHOOL ASSESSMENT SCHEDULER MODAL */}
      {isAddAssessmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[88vh] text-xs">
            
            {/* Modal Header (Fixed Top) */}
            <div className="flex justify-between items-center pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800/80 mb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-sky-600" /> Faculty Training & Evaluation Scheduler
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsAddAssessmentModalOpen(false); setAssessmentWizardStep(1); }}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP PROGRESS INDICATOR (Fixed Top) */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 shrink-0 mb-4">
              <div
                onClick={() => setAssessmentWizardStep(1)}
                className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                  assessmentWizardStep === 1
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                  assessmentWizardStep === 1 ? 'bg-white text-sky-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
                }`}>
                  1
                </div>
                <div>
                  <p className="text-[9px] uppercase font-black opacity-80">Step 1 of 2</p>
                  <p className="text-xs font-bold leading-tight">Assessment Details</p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

              <div
                onClick={() => {
                  if (wizardStep1.assessmentName.trim()) setAssessmentWizardStep(2);
                }}
                className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  assessmentWizardStep === 2
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border opacity-75'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                  assessmentWizardStep === 2 ? 'bg-white text-sky-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
                }`}>
                  2
                </div>
                <div>
                  <p className="text-[9px] uppercase font-black opacity-80">Step 2 of 2</p>
                  <p className="text-xs font-bold leading-tight">Schedule & Participants</p>
                </div>
              </div>
            </div>

            {/* SCROLLABLE BODY AREA */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1.5 space-y-4">
              {assessmentWizardStep === 1 ? (
                <div className="space-y-4">
                  {/* Quick Evaluation Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Quick Presets:</span>
                    {[
                      { name: 'Digital Pedagogy & Smart Classroom Skills Assessment', type: 'Digital Skills Test', category: 'Knowledge', marks: 100, pass: 40 },
                      { name: 'Subject Knowledge Mastery & Curriculum Evaluation', type: 'Subject Knowledge Test', category: 'Knowledge', marks: 100, pass: 50 },
                      { name: 'Classroom Discipline & Student Engagement Evaluation', type: 'Classroom Observation', category: 'Observation', marks: 50, pass: 25 },
                      { name: 'POCSO & Child Protection Compliance Quiz', type: 'Safety Assessment', category: 'Validation', marks: 50, pass: 35 }
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setWizardStep1({
                            ...wizardStep1,
                            assessmentName: preset.name,
                            assessmentType: preset.type as any,
                            category: preset.category as any,
                            totalMarks: preset.marks,
                            passingMarks: preset.pass
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800 text-[10px] font-bold whitespace-nowrap cursor-pointer shrink-0"
                      >
                        + {preset.type}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">Assessment Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Digital Pedagogy & Smart Board Competency Test"
                      value={wizardStep1.assessmentName}
                      onChange={e => setWizardStep1({ ...wizardStep1, assessmentName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold focus:border-sky-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">Assessment Type *</label>
                      <select
                        required
                        value={wizardStep1.assessmentType}
                        onChange={e => setWizardStep1({ ...wizardStep1, assessmentType: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold text-xs cursor-pointer"
                      >
                        <option value="">Select Assessment Type...</option>
                        <option value="Subject Knowledge Test">Subject Knowledge Test</option>
                        <option value="Teaching Competency">Teaching Competency</option>
                        <option value="Practical Demonstration">Practical Demonstration</option>
                        <option value="Classroom Observation">Classroom Observation</option>
                        <option value="Viva">Viva / Interview</option>
                        <option value="Online Assessment">Online Assessment</option>
                        <option value="Offline Assessment">Offline Assessment</option>
                        <option value="Digital Skills Test">Digital Skills Test</option>
                        <option value="Safety Assessment">Safety Assessment</option>
                        <option value="Internal Promotion Assessment">Internal Promotion Assessment</option>
                        <option value="Compliance Assessment">Compliance Assessment</option>
                        <option value="Custom Assessment">Custom Assessment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">Assessment Category *</label>
                      <select
                        required
                        value={wizardStep1.category}
                        onChange={e => setWizardStep1({ ...wizardStep1, category: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold text-xs cursor-pointer"
                      >
                        <option value="">Select Assessment Category...</option>
                        <option value="Knowledge">Knowledge</option>
                        <option value="Practical">Practical</option>
                        <option value="Observation">Observation</option>
                        <option value="Interview">Interview</option>
                        <option value="Certification">Certification</option>
                        <option value="Performance Evaluation">Performance Evaluation</option>
                        <option value="Validation">Validation</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">Total Marks *</label>
                      <input
                        type="number"
                        min={1}
                        value={wizardStep1.totalMarks}
                        onChange={e => setWizardStep1({ ...wizardStep1, totalMarks: Math.max(1, Number(e.target.value)) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">Passing Marks *</label>
                      <input
                        type="number"
                        min={1}
                        max={wizardStep1.totalMarks}
                        value={wizardStep1.passingMarks}
                        onChange={e => setWizardStep1({ ...wizardStep1, passingMarks: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-900 dark:text-white mb-1">Grading Scheme</label>
                      <select
                        value={wizardStep1.gradingScheme}
                        onChange={e => setWizardStep1({ ...wizardStep1, gradingScheme: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold text-xs cursor-pointer"
                      >
                        <option value="Letter Grade">Letter Grade (A+, A, B, C, F)</option>
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Pass/Fail">Pass / Fail Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Enter overview of assessment goals and competencies measured..."
                      value={wizardStep1.description}
                      onChange={e => setWizardStep1({ ...wizardStep1, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">Assessment Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Specify guidelines for candidates during the test..."
                      value={wizardStep1.instructions}
                      onChange={e => setWizardStep1({ ...wizardStep1, instructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Target Audience Filters */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">1. Participant Selection Filters</span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block font-semibold text-[10px] text-slate-500 mb-0.5">Employee Type</label>
                        <select
                          value={wizardStep2.targetEmployeeType}
                          onChange={e => setWizardStep2({ ...wizardStep2, targetEmployeeType: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-bold text-xs cursor-pointer"
                        >
                          <option value="Teaching Staff">Teaching Staff</option>
                          <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                          <option value="Both">Both (All Staff)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-[10px] text-slate-500 mb-0.5">Branch *</label>
                        <select
                          value={wizardStep2.branch}
                          onChange={e => setWizardStep2({ ...wizardStep2, branch: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-bold text-xs cursor-pointer"
                        >
                          <option value="Main Campus">Main Campus</option>
                          <option value="North Branch">North Branch</option>
                          <option value="West Campus">West Campus</option>
                          <option value="All">All Branches</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-[10px] text-slate-500 mb-0.5">Department *</label>
                        <select
                          value={wizardStep2.department}
                          onChange={e => setWizardStep2({ ...wizardStep2, department: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-bold text-xs cursor-pointer"
                        >
                          <option value="All">All Departments</option>
                          <option value="Academics">Academics (Teaching Staff)</option>
                          {availableDepartments.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-[10px] text-slate-500 mb-0.5">Designation</label>
                        <select
                          value={wizardStep2.designation}
                          onChange={e => setWizardStep2({ ...wizardStep2, designation: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-bold text-xs cursor-pointer"
                        >
                          <option value="All">All Designations</option>
                          {availableDesignations.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-sky-500" />
                          Selected Candidates ({selectedAssessmentCandidateIds.length} of {matchingAssessmentCandidates.length})
                        </span>
                        {selectedAssessmentCandidateIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedAssessmentCandidateIds([])}
                            className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Clear All Selected
                          </button>
                        )}
                      </div>

                      {/* Single Dropdown to Select Candidates directly */}
                      <div className="relative">
                        <select
                          value=""
                          onChange={e => {
                            const val = e.target.value;
                            if (!val) return;
                            if (val === 'SELECT_ALL') {
                              setSelectedAssessmentCandidateIds(matchingAssessmentCandidates.map(s => s.id));
                            } else if (val === 'DESELECT_ALL') {
                              setSelectedAssessmentCandidateIds([]);
                            } else if (val === 'SELECT_1') {
                              setSelectedAssessmentCandidateIds(matchingAssessmentCandidates.slice(0, 1).map(s => s.id));
                            } else if (val === 'SELECT_2') {
                              setSelectedAssessmentCandidateIds(matchingAssessmentCandidates.slice(0, 2).map(s => s.id));
                            } else if (val === 'SELECT_3') {
                              setSelectedAssessmentCandidateIds(matchingAssessmentCandidates.slice(0, 3).map(s => s.id));
                            } else {
                              if (!selectedAssessmentCandidateIds.includes(val)) {
                                setSelectedAssessmentCandidateIds([...selectedAssessmentCandidateIds, val]);
                              } else {
                                setSelectedAssessmentCandidateIds(selectedAssessmentCandidateIds.filter(id => id !== val));
                              }
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer hover:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-xs"
                        >
                          <option value="">Select Candidate from Dropdown...</option>
                          <optgroup label="⚡ Selection Actions">
                            <option value="SELECT_1">Select 1st Candidate</option>
                            <option value="SELECT_2">Select Top 2 Candidates</option>
                            <option value="SELECT_3">Select Top 3 Candidates</option>
                            <option value="SELECT_ALL">Select All Candidates ({matchingAssessmentCandidates.length})</option>
                            <option value="DESELECT_ALL">Deselect All Candidates</option>
                          </optgroup>
                          <optgroup label="👥 Available Staff Members">
                            {matchingAssessmentCandidates.map(emp => {
                              const isSelected = selectedAssessmentCandidateIds.includes(emp.id);
                              return (
                                <option key={emp.id} value={emp.id}>
                                  {isSelected ? '✓ [Selected] ' : '+ [Add] '} {emp.firstName} {emp.lastName} — {emp.designation || emp.role} ({emp.department || 'Academics'})
                                </option>
                              );
                            })}
                          </optgroup>
                        </select>
                      </div>

                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border rounded-xl p-1 bg-white/50 dark:bg-slate-900/50">
                        {matchingAssessmentCandidates.length === 0 ? (
                          <div className="p-4 text-center text-xs font-bold text-slate-400">
                            No staff members found matching the selected filters.
                          </div>
                        ) : (
                          matchingAssessmentCandidates.map(emp => (
                            <label key={emp.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-sky-50/60 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={selectedAssessmentCandidateIds.includes(emp.id)}
                                  onChange={e => {
                                    if (e.target.checked) setSelectedAssessmentCandidateIds([...selectedAssessmentCandidateIds, emp.id]);
                                    else setSelectedAssessmentCandidateIds(selectedAssessmentCandidateIds.filter(id => id !== emp.id));
                                  }}
                                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block">{emp.firstName} {emp.lastName}</span>
                                  <span className="text-[10px] font-bold text-slate-400 font-mono">{emp.id}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[10px]">{emp.designation || emp.role}</span>
                                <span className="text-[10px] text-slate-400 block font-medium">{emp.department || 'Main'} • {emp.branch || 'Main Campus'}</span>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Timing Details */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">2. Date, Time & Venue Configuration</span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1">Assessment Date *</label>
                        <input
                          type="date"
                          required
                          value={wizardStep2.assessmentDate}
                          onChange={e => setWizardStep2({ ...wizardStep2, assessmentDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Start Time *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 10:00 AM"
                          value={wizardStep2.startTime}
                          onChange={e => setWizardStep2({ ...wizardStep2, startTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">End Time *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 12:00 PM"
                          value={wizardStep2.endTime}
                          onChange={e => setWizardStep2({ ...wizardStep2, endTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">Assessment Mode</label>
                        <select
                          value={wizardStep2.mode}
                          onChange={e => setWizardStep2({ ...wizardStep2, mode: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold text-xs cursor-pointer"
                        >
                          <option value="Offline">Offline (Exam Hall)</option>
                          <option value="Online">Online (Computer Portal)</option>
                          <option value="Practical">Practical Demonstration</option>
                          <option value="Classroom Observation">Classroom Observation</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Venue / Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Smart Assessment Hall A"
                          value={wizardStep2.venue}
                          onChange={e => setWizardStep2({ ...wizardStep2, venue: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Evaluator Assignment & Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Main Evaluator *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Academic Director"
                        value={wizardStep2.evaluatorName}
                        onChange={e => setWizardStep2({ ...wizardStep2, evaluatorName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Co-Evaluator (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Vice Principal"
                        value={wizardStep2.coEvaluatorName}
                        onChange={e => setWizardStep2({ ...wizardStep2, coEvaluatorName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                      />
                    </div>
                  </div>

                  {/* Checkboxes Configuration */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border grid grid-cols-2 gap-2 font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizardStep2.options.notifyParticipants}
                        onChange={e => setWizardStep2({ ...wizardStep2, options: { ...wizardStep2.options, notifyParticipants: e.target.checked } })}
                      />
                      <span>Notify Participants (In-App / Email)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizardStep2.options.addToCalendar}
                        onChange={e => setWizardStep2({ ...wizardStep2, options: { ...wizardStep2.options, addToCalendar: e.target.checked } })}
                      />
                      <span>Add to Academic Calendar</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizardStep2.options.generateCertificatesOnCompletion}
                        onChange={e => setWizardStep2({ ...wizardStep2, options: { ...wizardStep2.options, generateCertificatesOnCompletion: e.target.checked } })}
                      />
                      <span>Auto Certificates on Pass</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizardStep2.options.publishImmediately}
                        onChange={e => setWizardStep2({ ...wizardStep2, options: { ...wizardStep2.options, publishImmediately: e.target.checked } })}
                      />
                      <span>Publish Schedule Immediately</span>
                    </label>
                  </div>

                  {/* REVIEW SUMMARY SUMMARY CARD */}
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-2">
                    <h4 className="font-extrabold text-xs text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-600" /> Review Assessment Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                      <p><strong>Name:</strong> {wizardStep1.assessmentName || 'Not Set'}</p>
                      <p><strong>Type:</strong> {wizardStep1.assessmentType} ({wizardStep1.category})</p>
                      <p><strong>Candidates:</strong> {selectedAssessmentCandidateIds.length} Employees</p>
                      <p><strong>Schedule:</strong> {wizardStep2.assessmentDate} ({wizardStep2.startTime || '10:00 AM'} - {wizardStep2.endTime || '12:00 PM'})</p>
                      <p><strong>Evaluator:</strong> {wizardStep2.evaluatorName || 'Not Assigned'}</p>
                      <p><strong>Passing Score:</strong> {wizardStep1.passingMarks} / {wizardStep1.totalMarks} Marks</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed Bottom, Always Visible, Never Cut Off!) */}
            <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              {assessmentWizardStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAddAssessmentModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    Next: Schedule & Participants <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setAssessmentWizardStep(1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    ← Back to Step 1
                  </button>
                  <button
                    type="button"
                    onClick={handleScheduleWizardSubmit}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Schedule Assessment
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* RECORD ATTENDANCE MODAL */}
      {isAttendanceModalOpen && selectedWorkshopForAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white">Record Workshop Attendance: {selectedWorkshopForAttendance.workshopName}</h3>
              <button onClick={() => setIsAttendanceModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {selectedWorkshopForAttendance.participants.map(p => (
                <div key={p.employeeId} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{p.employeeName}</p>
                    <p className="text-[10px] text-slate-500">{p.designation} • {p.department}</p>
                  </div>
                  <select
                    value={p.attendanceStatus}
                    onChange={e => {
                      const val = e.target.value as any;
                      setSelectedWorkshopForAttendance({
                        ...selectedWorkshopForAttendance,
                        participants: selectedWorkshopForAttendance.participants.map(item => item.employeeId === p.employeeId ? { ...item, attendanceStatus: val } : item)
                      });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border font-bold text-xs"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Excused">Excused</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsAttendanceModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-xl font-bold">Cancel</button>
              <button onClick={() => handleSaveAttendance(selectedWorkshopForAttendance.id)} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">Save Attendance</button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD EVALUATION MODAL */}
      {isEvaluateModalOpen && selectedAssessmentForEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white">Record Evaluation Marks: {selectedAssessmentForEvaluation.assessmentName}</h3>
              <button onClick={() => setIsEvaluateModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedAssessmentForEvaluation.results.map(r => (
                <div key={r.employeeId} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{r.employeeName}</p>
                      <p className="text-[10px] text-slate-500">{r.designation} • {r.department}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-600">Score:</span>
                      <input
                        type="number"
                        value={evaluationScores[r.employeeId]?.marksObtained ?? r.marksObtained}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setEvaluationScores({
                            ...evaluationScores,
                            [r.employeeId]: { ...evaluationScores[r.employeeId], marksObtained: val, remarks: evaluationScores[r.employeeId]?.remarks || '' }
                          });
                        }}
                        className="w-16 px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold text-right"
                      />
                      <span className="font-bold text-slate-400">/ {selectedAssessmentForEvaluation.totalMarks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsEvaluateModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-xl font-bold">Cancel</button>
              <button onClick={() => handleSaveEvaluation(selectedAssessmentForEvaluation.id)} className="px-5 py-2 bg-sky-600 text-white font-bold rounded-xl shadow-md">Publish Results & Certificates</button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE CERTIFICATE MODAL */}
      {selectedCertificateForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 text-center text-slate-900 dark:text-white relative">
            <button onClick={() => setSelectedCertificateForPreview(null)} className="absolute top-4 right-4 text-slate-400"><X className="w-6 h-6" /></button>

            {/* Certificate Header */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <GraduationCap className="w-8 h-8 text-amber-500" />
                <h2 className="text-xl font-black italic tracking-widest text-amber-600">PIRNAV SCHOOLS ERP</h2>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Centre for Professional Excellence & Faculty Development</p>
            </div>

            <div className="border-t border-b border-amber-200/60 dark:border-amber-900/40 py-6 space-y-3">
              <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white uppercase tracking-wide">Certificate of Achievement</h3>
              <p className="text-xs text-slate-500 italic">This is proudly presented to</p>
              <h4 className="text-xl font-black text-brand-600 dark:text-brand-400 underline decoration-amber-400">{selectedCertificateForPreview.employeeName}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                for successful completion and high performance in the <strong>{selectedCertificateForPreview.programType}</strong> program titled:
              </p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">"{selectedCertificateForPreview.programName}"</p>
            </div>

            <div className="flex justify-between items-center text-left text-xs text-slate-500 pt-2 font-mono">
              <div>
                <p><strong>Certificate No:</strong> {selectedCertificateForPreview.certificateNumber}</p>
                <p><strong>Issue Date:</strong> {selectedCertificateForPreview.completionDate}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedCertificateForPreview.issuedBy}</p>
                <p className="text-[10px] text-slate-400">Authorized Signatory</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Certificate
              </button>
              <button
                onClick={() => setSelectedCertificateForPreview(null)}
                className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default TrainingContainerView;
