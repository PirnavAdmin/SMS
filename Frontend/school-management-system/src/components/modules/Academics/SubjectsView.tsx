import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight, Loader2, ChevronDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { SubjectItem } from '../../../types';
import { fetchSubjectsApi, createSubjectApi, updateSubjectApi, deleteSubjectApi } from '../../../api/academic';

export const SubjectsView: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { academicClasses } = useData();

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectItem | null>(null);

  const [formData, setFormData] = useState<{
    subjectId: string;
    name: string;
    code: string;
    className: string;
  }>({
    subjectId: '',
    name: '',
    code: '',
    className: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredSubjects = subjects.filter(s => {
    const matchQuery = s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.subjectId.toLowerCase().includes(query.toLowerCase()) ||
      (s.code || '').toLowerCase().includes(query.toLowerCase());
    const matchClass = filterClass === 'All' || s.className === filterClass;
    return matchQuery && matchClass;
  });

  const totalPages = Math.ceil(filteredSubjects.length / pageSize) || 1;
  const paginated = filteredSubjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await fetchSubjectsApi();
      const dataArray = Array.isArray(data) ? data : (data?.data || data?.subjects || data?.items || []);
      const localClassMap = JSON.parse(localStorage.getItem('edu_db_subject_classes') || '{}');
      if (Array.isArray(dataArray)) {
        const mappedData = dataArray.map((item: any) => ({
          id: item.subjectId?.toString() || item.id?.toString() || Math.random().toString(),
          subjectId: item.subjectCode || '',
          name: item.subjectName || item.name || '',
          code: item.courseCode || item.code || '',
          className: item.className || localClassMap[item.subjectCode || item.id || ''] || ''
        }));
        setSubjects(mappedData);
      }
    } catch (error) {
      addToast('error', 'Error Fetching Subjects', 'Failed to load curriculum subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    const nextNum = Math.floor(100 + subjects.length + 1);
    setFormData({
      subjectId: '',
      name: '',
      code: '',
      className: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setFormData({
      subjectId: sub.subjectId,
      name: sub.name,
      code: sub.code || sub.subjectId,
      className: sub.className || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const finalSubjectId = formData.subjectId || `SUB-${Math.floor(100 + subjects.length + 1)}`;

    if (!formData.name) {
      addToast('warning', 'Required Fields', 'Subject Name is required.');
      return;
    }

    try {
      // Save className locally since backend DTO doesn't support it yet
      const localClassMap = JSON.parse(localStorage.getItem('edu_db_subject_classes') || '{}');
      localClassMap[finalSubjectId] = formData.className;
      localStorage.setItem('edu_db_subject_classes', JSON.stringify(localClassMap));

      if (editingSubject) {
        await updateSubjectApi(editingSubject.id as any, {
          subjectCode: finalSubjectId,
          subjectName: formData.name,
          courseCode: formData.code,
          className: formData.className
        } as any);
        addToast('success', 'Subject Updated', `Updated subject ${formData.name}`);
      } else {
        await createSubjectApi({
          subjectCode: finalSubjectId,
          subjectName: formData.name,
          courseCode: formData.code,
          className: formData.className
        } as any);
        addToast('success', 'Subject Created', `Added subject ${formData.name}`);
      }
      setIsFormOpen(false);
      loadSubjects();
    } catch (error: any) {
      addToast('error', 'Error Saving Subject', error.message || 'Failed to save subject data.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 dark:bg-brand-500/20 rounded-lg hidden sm:block">
            <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Subjects Management</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage all academic subjects and course codes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow shadow-sm"
            />
          </div>
          <div className="relative hidden sm:block">
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none cursor-pointer h-[38px]"
            >
              <option value="All">All Classes</option>
              {academicClasses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4 inline-block mr-1" /> Add Subject
          </button>
        </div>
      </div>

      <div className="glass-card bg-white dark:bg-[#0B1121] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 flex flex-col">
        <div className="w-full px-6 flex-1 py-4">
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/50">
                <th className="py-4 px-2">S.No</th>
                <th className="py-4 px-2">Subject Name</th>
                <th className="py-4 px-2">Assigned Class</th>
                <th className="py-4 px-2">Course Code</th>
                <th className="py-4 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">No subjects found.</td></tr>
              ) : (
                paginated.map((sub, index) => (
                  <tr key={sub.id} className="text-slate-700 dark:text-white border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-2 font-bold text-slate-500">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="py-4 px-2 font-bold">{sub.name}</td>
                    <td className="py-4 px-2 text-slate-500 font-medium">
                      {sub.className ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold">{sub.className}</span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-slate-400 font-mono text-[12px]">{sub.code || sub.subjectId}</td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleOpenEdit(sub)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                          title="Edit Subject"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSubject(sub)}
                          className="text-rose-500 hover:text-rose-400 transition-colors"
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
    </div>

    {/* Add / Edit Subject Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingSubject ? 'Edit Academic Subject' : 'Add New Academic Subject'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-[13px]">
              {/* Subject ID field removed per user request */}

              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white outline-none font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. MTH-101"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white outline-none font-mono font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Assign to Class</label>
                <div className="relative">
                  <select
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Select Class (Optional)</option>
                    {academicClasses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 dark:text-white bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 font-bold text-white bg-brand-600 dark:bg-[#020617] hover:bg-brand-700 dark:hover:bg-black rounded-xl shadow-md transition-colors">
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingSubject}
        title="Delete Subject"
        message={`Are you sure you want to delete ${deletingSubject?.name} (${deletingSubject?.subjectId})?`}
        onConfirm={async () => {
          if (deletingSubject) {
            try {
              await deleteSubjectApi(deletingSubject.id as any);
              addToast('success', 'Subject Deleted');
              setDeletingSubject(null);
              loadSubjects();
            } catch (error: any) {
              addToast('error', 'Error Deleting', error.message || 'Failed to delete subject.');
            }
          }
        }}
        onCancel={() => setDeletingSubject(null)}
      />
    </div>
  );
};
