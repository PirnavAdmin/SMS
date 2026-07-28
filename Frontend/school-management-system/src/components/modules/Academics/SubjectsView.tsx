import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Edit, Trash2, Search, X, Loader2, Building2, Layers, 
  AlertCircle, CheckCircle2, ShieldAlert, FolderPlus, Eye 
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { SubjectItem, Department } from '../../../types';
import { 
  fetchSubjectsApi, createSubjectApi, updateSubjectApi, deleteSubjectApi,
  fetchDepartmentsApi, createDepartmentApi, updateDepartmentApi, deleteDepartmentApi
} from '../../../api/academic';

export const SubjectsView: React.FC = () => {
  const { 
    departments: contextDepartments, addDepartment, updateDepartment, deleteDepartment,
    subjects: contextSubjects, addSubject, updateSubject, deleteSubject
  } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'subjects' | 'departments'>('subjects');

  // Subjects & Departments State
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectItem | null>(null);

  const [formData, setFormData] = useState<{
    subjectId: string;
    name: string;
    code: string;
    department: string;
  }>({
    subjectId: '',
    name: '',
    code: '',
    department: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Department State
  const [deptQuery, setDeptQuery] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [blockedDeleteDept, setBlockedDeleteDept] = useState<{ dept: Department; count: number } | null>(null);
  const [viewingDeptSubjects, setViewingDeptSubjects] = useState<Department | null>(null);
  const [deptSubjectSearch, setDeptSubjectSearch] = useState('');

  const [deptFormData, setDeptFormData] = useState<{
    departmentName: string;
    departmentCode: string;
    description: string;
    status: 'Active' | 'Inactive';
  }>({
    departmentName: '',
    departmentCode: '',
    description: '',
    status: 'Active'
  });

  // Filtered Subjects
  const filteredSubjects = subjects.filter(s => {
    const q = query.toLowerCase();
    const matchQuery = s.name.toLowerCase().includes(q) ||
      s.subjectId.toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q);
    return matchQuery;
  });

  const totalPages = Math.ceil(filteredSubjects.length / pageSize) || 1;
  const paginated = filteredSubjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filtered Departments
  const filteredDepartments = departments.filter(d => {
    const q = deptQuery.toLowerCase();
    return d.departmentName.toLowerCase().includes(q) ||
      (d.departmentCode || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q);
  });

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await fetchSubjectsApi();
      const dataArray = Array.isArray(data) ? data : (data?.data || data?.subjects || data?.items || []);
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        const mappedData = dataArray.map((item: any) => ({
          id: item.subjectId?.toString() || item.id?.toString() || Math.random().toString(),
          subjectId: item.subjectCode || '',
          name: item.subjectName || item.name || '',
          code: item.courseCode || item.code || '',
          department: item.department || item.departmentName || 'Mathematics'
        }));
        setSubjects(mappedData);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      addToast('error', 'Error Fetching Subjects', 'Failed to load curriculum subjects.');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await fetchDepartmentsApi();
      const dataArray = Array.isArray(data) ? data : (data?.data || []);
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        const mappedData = dataArray.map((item: any) => ({
          id: item.departmentId?.toString() || item.id?.toString() || Math.random().toString(),
          departmentName: item.departmentName || '',
          departmentCode: item.departmentCode || '',
          description: item.description || '',
          status: item.status || 'Active'
        }));
        setDepartments(mappedData);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      if (contextDepartments && contextDepartments.length > 0) {
        setDepartments(contextDepartments);
      } else {
        addToast('error', 'Error Fetching Departments', 'Failed to load curriculum departments.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
    loadDepartments();
  }, []);

  // Update local subjects list if context subjects change
  // Removed static context dependency per request

  // Subject Form Handlers
  const handleOpenAdd = () => {
    setEditingSubject(null);
    const activeDepts = departments.filter(d => d.status === 'Active');
    setFormData({
      subjectId: '',
      name: '',
      code: '',
      department: activeDepts[0]?.departmentName || 'Mathematics'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setFormData({
      subjectId: sub.subjectId,
      name: sub.name,
      code: sub.code || sub.subjectId,
      department: sub.department || 'Mathematics'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const finalSubjectId = formData.subjectId || `SUB-${Math.floor(100 + subjects.length + 1)}`;

    if (!formData.name.trim()) {
      addToast('warning', 'Required Field Missing', 'Subject Name is mandatory.');
      return;
    }

    if (!formData.department) {
      addToast('warning', 'Department Required', 'Please assign a department to this subject.');
      return;
    }

    const selectedDeptObj = departments.find(d => d.departmentName === formData.department);

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        subjectId: finalSubjectId,
        name: formData.name.trim(),
        code: formData.code.trim(),
        department: formData.department,
        departmentId: selectedDeptObj?.id
      });

      try {
        await updateSubjectApi(editingSubject.id as any, {
          subjectName: formData.name,
          courseCode: formData.code,
          departmentId: selectedDeptObj?.id || 1
        } as any);
        await loadSubjects();
      } catch (err) {
        // Silently handled
      }

      addToast('success', 'Subject Updated', `Updated subject '${formData.name}' assigned to '${formData.department}'.`);
    } else {
      addSubject({
        subjectId: finalSubjectId,
        name: formData.name.trim(),
        code: formData.code.trim(),
        department: formData.department,
        departmentId: selectedDeptObj?.id
      });

      try {
        await createSubjectApi({
          subjectName: formData.name,
          courseCode: formData.code,
          departmentId: selectedDeptObj?.id || 1
        } as any);
        await loadSubjects();
      } catch (err) {
        // Silently handled
      }

      addToast('success', 'Subject Created', `Added subject '${formData.name}' assigned to '${formData.department}'.`);
    }
    setIsFormOpen(false);
  };

  // Department Form Handlers
  const handleOpenAddDept = () => {
    setEditingDepartment(null);
    setDeptFormData({
      departmentName: '',
      departmentCode: '',
      description: '',
      status: 'Active'
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDepartment(dept);
    setDeptFormData({
      departmentName: dept.departmentName,
      departmentCode: dept.departmentCode || '',
      description: dept.description || '',
      status: dept.status
    });
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = deptFormData.departmentName.trim();
    if (!name) {
      addToast('warning', 'Validation Warning', 'Department Name is required.');
      return;
    }

    // Business Rule 1: Unique Department Name within Branch
    const isDuplicate = departments.some(d => 
      d.id !== editingDepartment?.id && 
      d.departmentName.toLowerCase().trim() === name.toLowerCase()
    );

    if (isDuplicate) {
      addToast('error', 'Duplicate Department', `Department name '${name}' already exists within this branch.`);
      return;
    }

    if (editingDepartment) {
      updateDepartment(editingDepartment.id, {
        departmentName: name,
        departmentCode: deptFormData.departmentCode.trim() || undefined,
        description: deptFormData.description.trim() || undefined,
        status: deptFormData.status
      });

      // Update local subjects state to reflect name change instantly
      if (editingDepartment.departmentName !== name) {
        setSubjects(prev => prev.map(s => {
          if (s.department === editingDepartment.departmentName || s.departmentId === editingDepartment.id) {
            return { ...s, department: name };
          }
          return s;
        }));
      }

      try {
        await updateDepartmentApi(editingDepartment.id, {
          departmentName: name,
          departmentCode: deptFormData.departmentCode.trim() || `DEPT-${name.substring(0, 3).toUpperCase()}`,
          description: deptFormData.description.trim(),
          status: deptFormData.status
        });
        await loadDepartments();
      } catch (err) {
        // Error handling
      }

      addToast('success', 'Department Updated', `Successfully updated department '${name}'.`);
    } else {
      const created = addDepartment({
        departmentName: name,
        departmentCode: deptFormData.departmentCode.trim() || `DEPT-${name.substring(0, 3).toUpperCase()}`,
        description: deptFormData.description.trim(),
        status: deptFormData.status
      });

      try {
        await createDepartmentApi({
          departmentName: name,
          departmentCode: deptFormData.departmentCode.trim() || `DEPT-${name.substring(0, 3).toUpperCase()}`,
          description: deptFormData.description.trim(),
          status: deptFormData.status
        });
        await loadDepartments();
      } catch (err) {
        // Error handling
      }

      // Auto select newly created department in subject form if open
      if (isFormOpen) {
        setFormData(prev => ({ ...prev, department: created.departmentName }));
      }

      addToast('success', 'Department Created', `Created department '${name}'.`);
    }

    setIsDeptModalOpen(false);
  };

  // Delete Department Handler with Safeguard Validation
  const handleAttemptDeleteDept = (dept: Department) => {
    // Count subjects assigned to this department
    const assignedSubjectsCount = subjects.filter(s => 
      s.department?.toLowerCase().trim() === dept.departmentName.toLowerCase().trim() ||
      s.departmentId === dept.id
    ).length;

    if (assignedSubjectsCount > 0) {
      // Block deletion and show required validation message
      setBlockedDeleteDept({ dept, count: assignedSubjectsCount });
    } else {
      setDeletingDepartment(dept);
    }
  };

  const handleConfirmDeleteDept = async () => {
    if (!deletingDepartment) return;
    deleteDepartment(deletingDepartment.id);
    
    try {
      await deleteDepartmentApi(deletingDepartment.id);
      await loadDepartments();
    } catch (err) {
      // Error handling
    }
    
    addToast('info', 'Department Deleted', `Removed department '${deletingDepartment.departmentName}'.`);
    setDeletingDepartment(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-brand-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Curriculum & Departments</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage academic subjects, course codes, and organizational department structures</p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'subjects'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Curriculum Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'departments'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Departments ({departments.length})
          </button>
        </div>
      </div>

      {/* TAB 1: SUBJECTS MANAGEMENT */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subjects, course code, department..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4 inline-block" /> Add Subject
              </button>
            </div>
          </div>

          <div className="glass-card bg-white dark:bg-[#0B1121] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800/50 flex flex-col overflow-hidden">
            <div className="w-full px-6 flex-1 py-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800/50">
                      <th className="py-3 px-2">S.No</th>
                      <th className="py-3 px-2">Subject Name</th>
                      <th className="py-3 px-2">Course Code</th>
                      <th className="py-3 px-2">Department</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" /></td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-500 font-bold">No subjects found matching criteria.</td></tr>
                    ) : (
                      paginated.map((sub, index) => (
                        <tr key={sub.id} className="text-slate-700 dark:text-white border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="py-3.5 px-2 font-bold text-slate-400 text-xs">{(currentPage - 1) * pageSize + index + 1}</td>
                          <td className="py-3.5 px-2 font-extrabold text-slate-900 dark:text-white">{sub.name}</td>
                          <td className="py-3.5 px-2 text-slate-500 font-mono text-xs">{sub.code || sub.subjectId}</td>
                          <td className="py-3.5 px-2">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {sub.department || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleOpenEdit(sub)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                                title="Edit Subject"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingSubject(sub)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT MANAGEMENT SCREEN */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search departments or code..."
                value={deptQuery}
                onChange={e => setDeptQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
              />
            </div>

            <button
              onClick={handleOpenAddDept}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Create Department
            </button>
          </div>

          <div className="glass-card bg-white dark:bg-[#0B1121] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800/50 flex flex-col overflow-hidden">
            <div className="w-full px-6 flex-1 py-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800/50">
                      <th className="py-3 px-2">S.No</th>
                      <th className="py-3 px-2">Department Name</th>
                      <th className="py-3 px-2">Department Code</th>
                      <th className="py-3 px-2">No. of Subjects</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {filteredDepartments.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-slate-500 font-bold">No departments found.</td></tr>
                    ) : (
                      filteredDepartments.map((dept, index) => {
                        const count = subjects.filter(s => 
                          s.department?.toLowerCase().trim() === dept.departmentName.toLowerCase().trim() ||
                          s.departmentId === dept.id
                        ).length;

                        return (
                          <tr key={dept.id} className="text-slate-700 dark:text-white border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="py-3.5 px-2 font-bold text-slate-400 text-xs">{index + 1}</td>
                            <td className="py-3.5 px-2">
                              <div className="font-extrabold text-slate-900 dark:text-white">{dept.departmentName}</div>
                              {dept.description && (
                                <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{dept.description}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-2 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                              {dept.departmentCode || '-'}
                            </td>
                            <td className="py-3.5 px-2">
                              <button
                                onClick={() => {
                                  setViewingDeptSubjects(dept);
                                  setDeptSubjectSearch('');
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs font-black font-mono inline-flex items-center gap-1.5 transition-all hover:scale-105 ${
                                  count > 0 
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                                title="Click to view assigned subjects"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                {count} Subject{count === 1 ? '' : 's'}
                              </button>
                            </td>
                            <td className="py-3.5 px-2">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                dept.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
                              }`}>
                                {dept.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setViewingDeptSubjects(dept);
                                    setDeptSubjectSearch('');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1 text-xs font-bold"
                                  title="View Department Subjects"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="hidden md:inline">Subjects</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEditDept(dept)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                  title="Edit Department"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleAttemptDeleteDept(dept)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Delete Department"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SUBJECT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingSubject ? 'Edit Academic Subject' : 'Add New Academic Subject'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Mathematics"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. MTH-101"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              {/* Department Selection (Mandatory) */}
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Department *</label>
                <select
                  required
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="" disabled>Select Department</option>
                  {departments
                    .filter(d => d.status === 'Active' || d.departmentName === formData.department)
                    .map(dept => (
                      <option key={dept.id} value={dept.departmentName}>
                        {dept.departmentName} {dept.departmentCode ? `(${dept.departmentCode})` : ''}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Every subject must belong to exactly one department.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md">
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DEPARTMENT MODAL */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {editingDepartment ? 'Modify Department' : 'Create New Department'}
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics / Performing Arts"
                  value={deptFormData.departmentName}
                  onChange={e => setDeptFormData({ ...deptFormData, departmentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Department Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. DEPT-MTH"
                  value={deptFormData.departmentCode}
                  onChange={e => setDeptFormData({ ...deptFormData, departmentCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Enter department scope or notes..."
                  value={deptFormData.description}
                  onChange={e => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Status *</label>
                <select
                  value={deptFormData.status}
                  onChange={e => setDeptFormData({ ...deptFormData, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md">
                  {editingDepartment ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOCKED DELETE DEPARTMENT WARNING MODAL */}
      {blockedDeleteDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
              <ShieldAlert className="w-7 h-7 shrink-0" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Cannot Delete Department</h3>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-slate-800 dark:text-amber-200 leading-relaxed font-medium space-y-2">
              <p className="font-bold text-amber-900 dark:text-amber-300">
                "This department cannot be deleted because it is assigned to one or more subjects. Reassign or remove those subjects before deleting the department."
              </p>
              <p className="text-[11px] text-slate-500 font-mono pt-1">
                Department <strong>{blockedDeleteDept.dept.departmentName}</strong> currently has <strong>{blockedDeleteDept.count}</strong> subject(s) assigned.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setBlockedDeleteDept(null)}
                className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md text-xs"
              >
                Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Subject Modal */}
      <ConfirmModal
        isOpen={!!deletingSubject}
        title="Delete Subject"
        message={`Are you sure you want to delete ${deletingSubject?.name} (${deletingSubject?.code || deletingSubject?.subjectId})?`}
        onConfirm={async () => {
          if (deletingSubject) {
            try {
              await deleteSubjectApi(deletingSubject.id as any);
              await loadSubjects();
              addToast('success', 'Subject Deleted', `Deleted subject '${deletingSubject.name}'.`);
            } catch (error: any) {}
            setDeletingSubject(null);
          }
        }}
        onCancel={() => setDeletingSubject(null)}
      />

      {/* Confirm Delete Department Modal (When 0 subjects assigned) */}
      <ConfirmModal
        isOpen={!!deletingDepartment}
        title="Delete Department"
        message={`Are you sure you want to delete department '${deletingDepartment?.departmentName}' (${deletingDepartment?.departmentCode})?`}
        onConfirm={handleConfirmDeleteDept}
        onCancel={() => setDeletingDepartment(null)}
      />

      {/* VIEW DEPARTMENT SUBJECTS MODAL */}
      {viewingDeptSubjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {viewingDeptSubjects.departmentName}
                    <span className="text-xs font-mono font-bold text-slate-400">
                      ({viewingDeptSubjects.departmentCode || 'DEPT'})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assigned Academic Subjects ({
                      subjects.filter(s => s.department?.toLowerCase().trim() === viewingDeptSubjects.departmentName.toLowerCase().trim() || s.departmentId === viewingDeptSubjects.id).length
                    })
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingDeptSubjects(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar & Search inside Modal */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subjects in this department..."
                  value={deptSubjectSearch}
                  onChange={e => setDeptSubjectSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  const targetDeptName = viewingDeptSubjects.departmentName;
                  setViewingDeptSubjects(null);
                  setEditingSubject(null);
                  setFormData({
                    subjectId: '',
                    name: '',
                    code: '',
                    department: targetDeptName
                  });
                  setIsFormOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>

            {/* Table List of Department Subjects */}
            <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl p-1 scrollbar-thin">
              {(() => {
                const deptAssignedSubs = subjects.filter(s => {
                  const isMatchDept = s.department?.toLowerCase().trim() === viewingDeptSubjects.departmentName.toLowerCase().trim() || s.departmentId === viewingDeptSubjects.id;
                  const isMatchSearch = s.name.toLowerCase().includes(deptSubjectSearch.toLowerCase()) || (s.code || s.subjectId).toLowerCase().includes(deptSubjectSearch.toLowerCase());
                  return isMatchDept && isMatchSearch;
                });

                if (deptAssignedSubs.length === 0) {
                  return (
                    <div className="text-center py-10 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-500">No subjects assigned to {viewingDeptSubjects.departmentName}</p>
                      <p className="text-[11px] text-slate-400">Click '+ Add Subject' above to assign a subject to this department.</p>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800">
                        <th className="py-2.5 px-3">S.No</th>
                        <th className="py-2.5 px-3">Subject Name</th>
                        <th className="py-2.5 px-3">Course Code</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold">
                      {deptAssignedSubs.map((sub, idx) => (
                        <tr key={sub.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">{sub.name}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{sub.code || sub.subjectId}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setViewingDeptSubjects(null);
                                  handleOpenEdit(sub);
                                }}
                                className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
                                title="Edit Subject"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setViewingDeptSubjects(null);
                                  setDeletingSubject(sub);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setViewingDeptSubjects(null)}
                className="px-4 py-1.5 font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
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
