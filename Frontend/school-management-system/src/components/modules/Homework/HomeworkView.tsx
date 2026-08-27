import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Plus, CheckCircle2, Calendar, Edit, Trash2, X, Paperclip, 
  Lock, Search, Save, Send, Users, User, ArrowRight, Eye, RefreshCw
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Homework, HomeworkAttachment, Student } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const HomeworkView: React.FC = () => {
  const { homework, addHomework, updateHomework, deleteHomework, staff, academicClasses, students, schoolProfile, fetchHomeworkData } = useData();

  useEffect(() => {
    if (fetchHomeworkData) {
      fetchHomeworkData();
    }
  }, [fetchHomeworkData]);
  const { role, user } = useAuth();
  const { addToast } = useToast();

  const isTeacherRole = (role as any) === 'Teacher' || (role as any) === 'Class Teacher';

  // RBAC checks
  const canModify = isTeacherRole || role === 'Super Admin';
  
  // Match current logged in teacher staff record dynamically from Admin staff database
  const dbTeacher = useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    // Filter staff to teaching staff ONLY (exclude drivers, peons, conductors)
    const academicStaff = staff.filter(s => {
      const desig = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      return !desig.includes('driver') && !desig.includes('conductor') && !desig.includes('peon') && !dept.includes('transport');
    });

    if (userEmail) {
      const byEmail = academicStaff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
      if (byEmail) return byEmail;
    }

    if (userName && !userName.includes('admin') && !userName.includes('driver')) {
      const byName = academicStaff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        return (sFullName && sFullName === userName) || (sName && sName === userName);
      });
      if (byName) return byName;
    }

    if (user?.id) {
      const byId = academicStaff.find(s => s.id === user.id);
      if (byId) return byId;
    }

    const rawName = user?.name || 'Robert Teacher';
    const nameParts = rawName.split(' ');
    return {
      id: user?.id || 'STF-2026-0001',
      empId: (user as any)?.empId || 'STF-2026-0001',
      firstName: nameParts[0] || 'Robert',
      lastName: nameParts.slice(1).join(' ') || 'Teacher',
      assignedClasses: ['Class 10-A', 'Class 9-B', 'Class 6-A'],
      assignedSubjects: ['Mathematics'],
      department: 'Mathematics',
      designation: 'Class Teacher'
    };
  }, [user, staff]);

  const teacher = dbTeacher;

  const teacherAssignedClasses = useMemo(() => {
    let raw = (dbTeacher as any)?.assignedClasses || (dbTeacher as any)?.classes || (dbTeacher as any)?.assignedClass || [];
    if (typeof raw === 'string') raw = [raw];
    const list = (Array.isArray(raw) && raw.length > 0) ? [...raw] : ['Class 10-A', 'Class 9-B', 'Class 6-A'];
    const cleaned = list.map((c: string) => {
      let str = c.trim();
      if (!str.toLowerCase().startsWith('class')) str = `Class ${str}`;
      return str;
    }).filter((c: string) => !c.toLowerCase().includes('nursery') && !c.toLowerCase().includes('lkg') && !c.toLowerCase().includes('ukg'));

    return cleaned.length > 0 ? cleaned : ['Class 10-A', 'Class 9-B', 'Class 6-A'];
  }, [dbTeacher]);

  const assignedSubjects = (dbTeacher as any)?.assignedSubjects || ['Mathematics', 'Science'];

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    teacherAssignedClasses.forEach(ac => {
      let mainCls = ac.split('-')[0].trim();
      if (!mainCls.toLowerCase().startsWith('class')) {
        mainCls = `Class ${mainCls}`;
      }
      if (!mainCls.toLowerCase().includes('nursery') && !mainCls.toLowerCase().includes('lkg') && !mainCls.toLowerCase().includes('ukg')) {
        set.add(mainCls);
      }
    });
    const list = Array.from(set);
    return list.length > 0 ? list : ['Class 10', 'Class 9', 'Class 6'];
  }, [teacherAssignedClasses]);

  const subjectOptions = assignedSubjects;

  // Clean class name helper
  const cleanClassName = (cls: string) => {
    if (!cls) return '';
    return cls.replace(/^Class\s*/i, '').replace(/^Grade\s*/i, '').trim();
  };

  const rbacHomework = useMemo(() => {
    return homework.filter(h => 
      teacherAssignedClasses.some(c => 
        cleanClassName(c.split('-')[0]) === cleanClassName(h.className)
      )
    );
  }, [homework, teacherAssignedClasses]);

  // Filters State
  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All'); // All, Draft, Published, Due Today
  const [filterDate, setFilterDate] = useState('');

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBigScreenOpen, setIsBigScreenOpen] = useState(false); // Big screen notepad state
  const [wrapLines, setWrapLines] = useState(false); // Textarea wrapping state
  const [showSplitPreview, setShowSplitPreview] = useState(true); // Split live preview state
  
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [deletingHomework, setDeletingHomework] = useState<Homework | null>(null);
  const [viewingHomework, setViewingHomework] = useState<Homework | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Homework>>({
    title: '',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    teacherName: `${teacher.firstName} ${teacher.lastName}`,
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    description: '',
    status: 'Published',
    publishToType: 'Class',
    publishedStudentIds: [],
    totalSubmissions: 0
  });

  const [attachments, setAttachments] = useState<HomeworkAttachment[]>([]);
  const [newAttName, setNewAttName] = useState('');
  
  // Roster Checklist search/selected states inside form
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Student Fallback dataset for form selectors
  const enrolledStudents = useMemo(() => {
    const base = students.length > 0 ? students : [
      { id: '101', firstName: 'Rahul', lastName: 'Sharma', className: 'Class 10', section: 'A', rollNo: '001' },
      { id: '102', firstName: 'Priya', lastName: 'Patel', className: 'Class 10', section: 'A', rollNo: '002' },
      { id: '103', firstName: 'Aditya', lastName: 'Verma', className: 'Class 10', section: 'A', rollNo: '003' },
      { id: '104', firstName: 'Ananya', lastName: 'Iyer', className: 'Class 10', section: 'A', rollNo: '004' },
      { id: '105', firstName: 'Vikram', lastName: 'Singh', className: 'Class 9', section: 'A', rollNo: '001' },
      { id: '106', firstName: 'Sneha', lastName: 'Reddy', className: 'Class 9', section: 'B', rollNo: '001' }
    ] as any[];
    return base as Student[];
  }, [students]);

  // Load students for target class/section
  const formClassStudents = useMemo(() => {
    const targetCls = cleanClassName(formData.className || '');
    const targetSec = formData.section || 'A';
    return enrolledStudents.filter(s => 
      cleanClassName(s.className) === targetCls && 
      s.section === targetSec
    );
  }, [enrolledStudents, formData.className, formData.section]);

  // Filter students checklist inside form
  const filteredChecklistStudents = useMemo(() => {
    return formClassStudents.filter(s => 
      s.firstName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.rollNo.includes(studentSearchQuery)
    );
  }, [formClassStudents, studentSearchQuery]);

  // Checkbox triggers
  const handleToggleStudent = (sid: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === formClassStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(formClassStudents.map(s => s.id));
    }
  };

  const insertSymbol = (val: string) => {
    setFormData(prev => ({
      ...prev,
      description: (prev.description || '') + val
    }));
  };

  const handleOpenAdd = () => {
    if (!canModify) {
      addToast('error', 'Access Restricted', 'Only Teachers can create homework assignments.');
      return;
    }
    setEditingHomework(null);
    setAttachments([]);
    setSelectedStudentIds([]);
    setStudentSearchQuery('');
    setFormData({
      title: '',
      className: classOptions[0] || 'Class 10',
      section: teacherAssignedClasses[0]?.split('-')[1] || 'A',
      subject: subjectOptions[0] || 'Mathematics',
      teacherName: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      description: '',
      status: 'Published',
      publishToType: 'Class',
      publishedStudentIds: [],
      totalSubmissions: 0
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (hw: Homework) => {
    if (!canModify) {
      addToast('error', 'Access Restricted', 'Only Teachers can edit homework.');
      return;
    }
    setEditingHomework(hw);
    setAttachments(hw.attachments || []);
    setSelectedStudentIds(hw.publishedStudentIds || []);
    setStudentSearchQuery('');
    setFormData({
      ...hw,
      status: hw.status || 'Published',
      publishToType: hw.publishToType || 'Class',
      publishedStudentIds: hw.publishedStudentIds || []
    });
    setIsFormOpen(true);
  };

  const handleAddAttachment = () => {
    if (!newAttName) return;
    const att: HomeworkAttachment = {
      id: 'ATT-' + Math.floor(100 + Math.random() * 900),
      name: newAttName,
      url: '#',
      type: newAttName.endsWith('.pdf') ? 'PDF' : newAttName.endsWith('.png') ? 'Image' : 'Doc'
    };
    setAttachments(prev => [...prev, att]);
    setNewAttName('');
  };

  const handleSaveForm = (statusMode: 'Draft' | 'Published') => {
    if (!formData.title || !formData.description) {
      addToast('warning', 'Incomplete Form', 'Please fill in the title and description.');
      return;
    }

    const dataToSave = { 
      ...formData, 
      attachments,
      status: statusMode,
      publishedStudentIds: formData.publishToType === 'Students' ? selectedStudentIds : []
    };

    if (editingHomework) {
      updateHomework(editingHomework.id, dataToSave);
      addToast('success', 'Homework Saved', `Successfully updated draft/assignment: ${formData.title}`);
    } else {
      addHomework(dataToSave as Omit<Homework, 'id'>);
      addToast('success', 'Homework Posted', `Posted homework assignment: ${formData.title}`);
    }
    setIsFormOpen(false);
    setIsBigScreenOpen(false);
  };

  // Roster filter list calculations
  const filteredHomeworkList = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return rbacHomework.filter(h => {
      const matchQuery = h.title.toLowerCase().includes(query.toLowerCase()) || h.description.toLowerCase().includes(query.toLowerCase());
      const matchClass = filterClass === 'All' || h.className === filterClass;
      const matchSubject = filterSubject === 'All' || h.subject === filterSubject;
      const matchDate = filterDate ? h.dueDate === filterDate || h.assignedDate === filterDate : true;
      
      let matchStatus = true;
      if (filterStatus === 'Draft') {
        matchStatus = h.status === 'Draft';
      } else if (filterStatus === 'Published') {
        matchStatus = h.status === 'Published' || !h.status;
      } else if (filterStatus === 'Due Today') {
        matchStatus = h.dueDate === todayStr;
      }

      return matchQuery && matchClass && matchSubject && matchDate && matchStatus;
    });
  }, [rbacHomework, query, filterClass, filterSubject, filterStatus, filterDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
      
      {/* Header card */}
      <div className="glass-card py-4 px-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0" />
            Homework Assignments
          </h2>
        </div>

        {canModify ? (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create Homework</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold border border-amber-100 text-xs">
            <Lock className="w-3.5 h-3.5" /> Read-Only Admin Workspace
          </div>
        )}
      </div>

      {/* Search & Filters Row */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title or topic..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:border-sky-500"
            >
              <option value="All">All Classes</option>
              {classOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:border-sky-500"
            >
              <option value="All">All Subjects</option>
              {subjectOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:border-sky-500"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Due Today">Due Today</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              onClick={e => e.currentTarget.showPicker?.()}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Homework List Full-Page Width Table */}
      <div className="w-full space-y-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
          
          <div className="flex items-center justify-between pb-2">
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
              Assigned Homework Register ({filteredHomeworkList.length} Entries)
            </span>
          </div>

          {/* Roster table container - Forced Webkit scrollbars */}
          <div className="rounded-2xl overflow-x-scroll">
            <table className="w-full min-w-[850px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-505 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 w-48">Homework Title</th>
                  <th className="py-3 px-4 w-28">Class Room</th>
                  <th className="py-3 px-4 w-32">Subject</th>
                  <th className="py-3 px-4 w-32">Due Date</th>
                  <th className="py-3 px-4 w-36">Published To</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredHomeworkList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">No homework assignments found.</td>
                  </tr>
                ) : (
                  filteredHomeworkList.map(hw => {
                    const isDraft = hw.status === 'Draft';
                    const isToday = hw.dueDate === new Date().toISOString().split('T')[0];
                    return (
                      <tr key={hw.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 text-slate-855 dark:text-slate-200">
                        <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{hw.title}</td>
                        <td className="py-3 px-4 font-bold text-sky-650">{hw.className}-{hw.section}</td>
                        <td className="py-3 px-4">{hw.subject}</td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" /> {hw.dueDate}
                        </td>
                        <td className="py-3 px-4">
                          {hw.publishToType === 'Students' ? (
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-extrabold flex items-center gap-1 w-max">
                              <Users className="w-3 h-3" /> {hw.publishedStudentIds?.length || 0} Students
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-105 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-extrabold flex items-center gap-1 w-max">
                              <Users className="w-3 h-3" /> Entire Class
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isDraft 
                              ? 'bg-slate-100 text-slate-500' 
                              : isToday 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-emerald-100 text-emerald-805'
                          }`}>
                            {isDraft ? '📝 Draft' : isToday ? 'Due Today' : 'Published'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingHomework(hw)}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-sky-600 transition-colors font-bold text-[10px]"
                            >
                              View
                            </button>
                            {canModify && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(hw)}
                                  className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-655 transition-colors font-bold text-[10px]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingHomework(hw)}
                                  className="p-1 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
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

      {/* ----------------- MODAL: CREATE / EDIT HOMEWORK FORM ----------------- */}
      {isFormOpen && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsFormOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingHomework ? 'Edit Homework Assignment' : 'Create New Homework Assignment'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-3 text-xs overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-2 pr-1">
              
              <div>
                <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Homework Title <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Algebra Practice Worksheet"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-800 font-bold outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Class</label>
                  <select 
                    value={formData.className} 
                    onChange={e => setFormData({ ...formData, className: e.target.value })} 
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-800 font-bold outline-none"
                  >
                    {classOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Section</label>
                  <select 
                    value={formData.section} 
                    onChange={e => setFormData({ ...formData, section: e.target.value })} 
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-800 font-bold outline-none"
                  >
                    {Array.from(new Set(
                      teacherAssignedClasses
                        .filter(c => cleanClassName(c.split('-')[0]) === cleanClassName(formData.className || ''))
                        .map(c => c.split('-')[1])
                        .concat(['A', 'B'])
                        .filter(Boolean)
                    )).map(sec => (
                      <option key={sec} value={sec}>Sec {sec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <select 
                    value={formData.subject} 
                    onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-800 font-bold outline-none"
                  >
                    {subjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publish To Block - Custom selectors added below Class/Section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border space-y-2.5">
                <label className="block font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Publish To</label>
                
                <div className="flex gap-4 font-bold text-slate-600 dark:text-slate-350">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="publishToType"
                      checked={formData.publishToType === 'Class'}
                      onChange={() => setFormData({ ...formData, publishToType: 'Class' })}
                      className="accent-brand-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Entire Class (Default)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="publishToType"
                      checked={formData.publishToType === 'Students'}
                      onChange={() => setFormData({ ...formData, publishToType: 'Students' })}
                      className="accent-brand-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Selected Students</span>
                  </label>
                </div>

                {/* Selected Students checklist wrapper with Search */}
                {formData.publishToType === 'Students' && (
                  <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 animate-in slide-in-from-top-1 duration-150">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-450 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Search student by name or roll..."
                          value={studentSearchQuery}
                          onChange={e => setStudentSearchQuery(e.target.value)}
                          className="w-full pl-7.5 pr-3 py-1 bg-white dark:bg-slate-900 border rounded-lg outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectAllStudents}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg font-extrabold text-[10px]"
                      >
                        {selectedStudentIds.length === formClassStudents.length ? 'Clear All' : 'Select All'}
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-2 max-h-36 overflow-y-auto grid grid-cols-2 gap-2">
                      {filteredChecklistStudents.length === 0 ? (
                        <p className="text-center text-slate-400 italic col-span-2 py-4">No students found matching target.</p>
                      ) : (
                        filteredChecklistStudents.map(st => {
                          const isSelected = selectedStudentIds.includes(st.id);
                          return (
                            <label 
                              key={st.id} 
                              className={`flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border ${
                                isSelected 
                                  ? 'border-brand-500/40 bg-brand-50/20 dark:bg-brand-950/20' 
                                  : 'border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleStudent(st.id)}
                                className="accent-brand-600 cursor-pointer"
                              />
                              <span className="truncate font-bold text-slate-800 dark:text-slate-200">
                                {st.firstName} {st.lastName} <strong className="text-slate-400">({st.rollNo})</strong>
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-800 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Attach Files (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Attachment file name (e.g. Worksheet.pdf)"
                    value={newAttName}
                    onChange={e => setNewAttName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 outline-none"
                  />
                  <button type="button" onClick={handleAddAttachment} className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-505 text-white font-black">Add</button>
                </div>
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {attachments.map(att => (
                      <span key={att.id} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-355 font-semibold flex items-center gap-1">
                        {att.name}
                        <button type="button" onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-rose-500 font-bold hover:text-rose-700">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-extrabold text-slate-700 dark:text-slate-300">
                  Instructions / Description * (Lined Notepad Editor)
                </label>
                
                {/* Clicking or selecting here opens the full big screen editor workspace */}
                <textarea
                  rows={2}
                  required
                  readOnly
                  onClick={() => setIsBigScreenOpen(true)}
                  onFocus={() => setIsBigScreenOpen(true)}
                  value={formData.description}
                  placeholder="Click here to open the Big Screen Notepad Workspace and type math/science questions..."
                  className="w-full px-3 py-2 border rounded-2xl outline-none notepad-lines shadow-inner cursor-pointer hover:border-brand-500 transition-all leading-relaxed"
                />
                <span className="text-[10px] text-brand-600 font-bold flex items-center gap-1">
                  💡 Click the notepad to expand into full-screen editor mode.
                </span>
              </div>

              {/* Form buttons footer - Changed as requested to [Save Draft] [Publish Homework] Cancel */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)} 
                  className="px-4 py-2 font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleSaveForm('Draft')}
                  className="px-4 py-2 font-black bg-slate-105 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border rounded-xl"
                >
                  Save Draft
                </button>
                <button 
                  type="button"
                  onClick={() => handleSaveForm('Published')}
                  className="px-4 py-2 font-black bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md"
                >
                  Publish Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: BIG SCREEN NOTEPAD WORKSPACE ----------------- */}
      {isBigScreenOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto"
          onClick={() => setIsBigScreenOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl w-full max-w-6xl h-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden my-auto"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-55/80 dark:bg-slate-800/80 backdrop-blur border-b flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Notepad Workspace - Lined Editor
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Class: {formData.className}-{formData.section} &bull; Subject: {formData.subject}
                  </p>
                </div>
              </div>

              {/* View options controls */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer font-extrabold text-slate-655 dark:text-slate-350 select-none text-[11px]">
                  <input
                    type="checkbox"
                    checked={wrapLines}
                    onChange={e => setWrapLines(e.target.checked)}
                    className="accent-brand-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Wrap Text Lines</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-extrabold text-slate-655 dark:text-slate-350 select-none text-[11px]">
                  <input
                    type="checkbox"
                    checked={showSplitPreview}
                    onChange={e => setShowSplitPreview(e.target.checked)}
                    className="accent-brand-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Show Split Live Preview</span>
                </label>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

                <button 
                  type="button"
                  onClick={() => setIsBigScreenOpen(false)}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Screen Workspace Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950">
              
              {/* Left Side: Notepad Editor Area */}
              <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden border-r border-slate-200 dark:border-slate-800">
                
                {/* Symbols Toolbar */}
                <div className="border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 p-3 space-y-2 no-print shrink-0 shadow-xs">
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[9.5px] font-black uppercase text-slate-400 mr-2 shrink-0">Math Symbols:</span>
                    {['²', '√', 'π', 'θ', '∑', '∫', '½', '±', '≠', '≈', 'α', 'β', 'γ', '÷', '×', '°', '∞', '∆'].map(sym => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => insertSymbol(sym)}
                        className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border text-[11px] font-bold text-slate-750 dark:text-slate-205 shadow-xs cursor-pointer transition-colors"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 items-center border-t border-slate-100 dark:border-slate-800/80 pt-2">
                    <span className="text-[9.5px] font-black uppercase text-slate-400 mr-1.5 shrink-0">Science Formulas:</span>
                    {['H₂O', 'CO₂', 'O₂', '→', '⇌', '℃', 'Δ', 'NaCl', 'H₂SO₄', 'NaOH', 'HCl', 'Fe₂O₃'].map(sym => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => insertSymbol(sym)}
                        className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border text-[10px] font-bold text-slate-750 dark:text-slate-205 shadow-xs cursor-pointer transition-colors"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 items-center border-t border-slate-100 dark:border-slate-800/80 pt-2">
                    <span className="text-[9.5px] font-black uppercase text-slate-400 mr-2 shrink-0">Templates:</span>
                    {[
                      { label: 'Q1 Question Format', value: '\nQ1. [Enter Question here] (Marks: 5)\nAns. \n' },
                      { label: 'Solve Math Equation', value: '\nSolve for x: x² - 5x + 6 = 0\n' },
                      { label: 'Balance Chemistry Reaction', value: '\nBalance: H₂ + O₂ → H₂O\n' },
                      { label: 'Physics Velocity Formula', value: '\nCalculate: v = d/t where d = 100m, t = 10s\n' }
                    ].map(tpl => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => insertSymbol(tpl.value)}
                        className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950 text-[10px] font-extrabold text-sky-700 dark:text-sky-300 shadow-xs cursor-pointer border border-sky-100 dark:border-sky-900/60 transition-colors"
                      >
                        + {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lined Notepad Editor Textarea container with both vertical/horizontal scrollbars */}
                <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner flex bg-[#fffdf5] dark:bg-slate-900">
                  <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Start drafting your homework questions on this legal notebook..."
                    className="w-full h-full p-4 border-0 outline-none notepad-lines resize-none overflow-x-scroll overflow-y-scroll"
                    style={{
                      whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
                      minWidth: wrapLines ? '100%' : '1200px'
                    }}
                  />
                </div>
              </div>

              {/* Right Side: Live Document Preview Panel */}
              {showSplitPreview && (
                <div className="w-full md:w-[480px] bg-slate-100 dark:bg-slate-900/50 p-4 overflow-y-scroll flex flex-col gap-4 border-l border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider shrink-0">
                    <Eye className="w-3.5 h-3.5" /> Live Student View Preview
                  </div>

                  {/* Simulated Homework Assignment Page layout */}
                  <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl shadow-md border border-slate-200/50 dark:border-slate-800/80 space-y-5 text-slate-800 dark:text-slate-250 flex-1">
                    
                    {/* Header */}
                    <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-200 dark:border-slate-700">
                      <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">
                        {schoolProfile.name}
                      </h4>
                      <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-extrabold text-brand-600 tracking-widest uppercase">
                        Homework Assignment
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">Session {(formData as any).academicYear || '2025-2026'}</p>
                    </div>

                    {/* Metadata block */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border text-[10px] font-semibold text-slate-600 dark:text-slate-350">
                      <div>
                        <span className="block text-[8px] uppercase text-slate-400 font-bold">Assignment Title</span>
                        <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate mt-0.5">
                          {formData.title || 'Untitled Homework'}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-slate-400 font-bold">Class Section</span>
                        <p className="font-bold text-slate-850 dark:text-slate-200 mt-0.5">
                          {formData.className}-{formData.section}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-slate-400 font-bold">Subject Name</span>
                        <p className="font-bold text-slate-850 dark:text-slate-200 mt-0.5">
                          {formData.subject}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-slate-400 font-bold">Due Date Limits</span>
                        <p className="font-bold text-rose-600 mt-0.5">
                          {formData.dueDate}
                        </p>
                      </div>
                    </div>

                    {/* Audience distribution */}
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400 font-bold">Published Target Audience</span>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-bold text-[10.5px]">
                        {formData.publishToType === 'Students' 
                          ? `Selected target students group (${selectedStudentIds.length} students)` 
                          : 'Entire Class Enrollment Group'}
                      </p>
                    </div>

                    {/* Instructions Content Render box */}
                    <div className="space-y-1.5 flex-1">
                      <span className="block text-[8px] uppercase text-slate-400 font-bold">Assignment Questions</span>
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-[11px] font-medium leading-relaxed font-mono whitespace-pre overflow-x-auto text-slate-905 dark:text-slate-200">
                        {formData.description || 'No instruction drafts entered.'}
                      </div>
                    </div>

                    {/* Signatures placeholder */}
                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 text-[9px] font-bold text-slate-450 uppercase">
                      <span>By: {formData.teacherName}</span>
                      <span>Authorized Draft Seal</span>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                <span>Status: </span>
                <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${
                  formData.status === 'Draft' ? 'bg-amber-105 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {formData.status === 'Draft' ? 'Draft' : 'Published'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBigScreenOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl"
                >
                  Return to Details Form
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveForm('Draft')}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-250 hover:bg-slate-50 dark:hover:bg-slate-750 font-black text-slate-700 dark:text-slate-200 rounded-xl"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveForm('Published')}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-xl shadow-md"
                >
                  Publish Homework
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- MODAL: VIEW DETAILS ----------------- */}
      {viewingHomework && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setViewingHomework(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[9.5px] font-black uppercase text-brand-600 dark:text-brand-400">Assignment Details</span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">{viewingHomework.title}</h3>
              </div>
              <button onClick={() => setViewingHomework(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 text-slate-500 font-bold">✕</button>
            </div>

            <div className="space-y-3 font-semibold text-slate-750 dark:text-slate-350">
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div>
                  <span className="block text-[8.5px] text-slate-400 uppercase font-bold">Class & Subject</span>
                  <p className="text-slate-855 dark:text-slate-200 mt-0.5">{viewingHomework.className}-{viewingHomework.section} &bull; {viewingHomework.subject}</p>
                </div>
                <div>
                  <span className="block text-[8.5px] text-slate-400 uppercase font-bold">Due Date</span>
                  <p className="text-rose-600 mt-0.5 font-bold">{viewingHomework.dueDate}</p>
                </div>
              </div>

              <div>
                <span className="block text-[8.5px] text-slate-400 uppercase font-bold">Published Target</span>
                <p className="text-slate-805 dark:text-slate-200 mt-0.5">
                  {viewingHomework.publishToType === 'Students' ? `Selected Students only (${viewingHomework.publishedStudentIds?.length || 0} students)` : 'Entire Class'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border">
                <span className="block text-[8.5px] text-slate-400 uppercase font-bold mb-1">Homework Instructions</span>
                <p className="font-medium leading-relaxed whitespace-pre-wrap">{viewingHomework.description}</p>
              </div>

              {viewingHomework.attachments && viewingHomework.attachments.length > 0 && (
                <div>
                  <span className="block text-[8.5px] text-slate-400 uppercase font-bold mb-1">Attachments</span>
                  <div className="flex flex-wrap gap-1">
                    {viewingHomework.attachments.map(att => (
                      <span key={att.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold text-[9px] flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-brand-500" /> {att.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewingHomework(null)}
              className="w-full py-2.5 bg-brand-650 hover:bg-brand-600 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingHomework}
        title="Delete Homework"
        message={`Are you sure you want to delete ${deletingHomework?.title}?`}
        onConfirm={() => {
          if (deletingHomework) {
            deleteHomework(deletingHomework.id);
            addToast('success', 'Homework Deleted');
            setDeletingHomework(null);
          }
        }}
        onCancel={() => setDeletingHomework(null)}
      />
    </div>
  );
};
