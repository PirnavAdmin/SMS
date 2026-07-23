import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { SubjectItem } from '../../../types';
import { fetchSubjectsApi, createSubjectApi, updateSubjectApi, deleteSubjectApi } from '../../../api/academic';

export const SubjectsView: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectItem | null>(null);

  const [formData, setFormData] = useState<{
    subjectId: string;
    name: string;
    code: string;
  }>({
    subjectId: '',
    name: '',
    code: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.subjectId.toLowerCase().includes(query.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSubjects.length / pageSize) || 1;
  const paginated = filteredSubjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await fetchSubjectsApi();
      const dataArray = Array.isArray(data) ? data : (data?.data || data?.subjects || data?.items || []);
      if (Array.isArray(dataArray)) {
        const mappedData = dataArray.map((item: any) => ({
          id: item.subjectId?.toString() || item.id?.toString() || Math.random().toString(),
          subjectId: item.subjectCode || '',
          name: item.subjectName || item.name || '',
          code: item.courseCode || item.code || ''
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
      subjectId: `SUB-${nextNum}`,
      name: '',
      code: `SUB-${nextNum}`
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setFormData({
      subjectId: sub.subjectId,
      name: sub.name,
      code: sub.code || sub.subjectId
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subjectId) {
      addToast('warning', 'Required Fields', 'Subject ID and Subject Name are required.');
      return;
    }

    try {
      if (editingSubject) {
        await updateSubjectApi(editingSubject.id as any, {
          subjectCode: formData.subjectId,
          subjectName: formData.name,
          courseCode: formData.code
        });
        addToast('success', 'Subject Updated', `Updated subject ${formData.name}`);
      } else {
        await createSubjectApi({
          subjectCode: formData.subjectId,
          subjectName: formData.name,
          courseCode: formData.code
        });
        addToast('success', 'Subject Created', `Added subject ${formData.name} (${formData.subjectId})`);
      }
      setIsFormOpen(false);
      loadSubjects();
    } catch (error: any) {
      addToast('error', 'Error Saving Subject', error.message || 'Failed to save subject data.');
    }
  };

  return (
    <div className="animate-in fade-in h-full bg-white dark:bg-[#0B1121] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-slate-200 dark:border-slate-800/50 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 dark:bg-brand-500/20 rounded-lg hidden sm:block">
            <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Subjects Management</h2>
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
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4 inline-block mr-1" /> Add Subject
          </button>
        </div>
      </div>

      <div className="w-full px-6 flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/50">
                <th className="py-4 px-2">Subject ID</th>
                <th className="py-4 px-2">Subject Name</th>
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
                paginated.map(sub => (
                  <tr key={sub.id} className="text-slate-700 dark:text-white border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-2 font-bold">{sub.subjectId}</td>
                    <td className="py-4 px-2 font-bold">{sub.name}</td>
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
              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Subject ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUB-101"
                  value={formData.subjectId}
                  onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-mono outline-none font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

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
