import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { SubjectItem } from '../../../types';

export const SubjectsView: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useData();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subjectId) {
      addToast('warning', 'Required Fields', 'Subject ID and Subject Name are required.');
      return;
    }

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        subjectId: formData.subjectId,
        name: formData.name,
        code: formData.code
      });
      addToast('success', 'Subject Updated', `Updated subject ${formData.name}`);
    } else {
      addSubject({
        subjectId: formData.subjectId,
        name: formData.name,
        code: formData.code
      });
      addToast('success', 'Subject Created', `Added subject ${formData.name} (${formData.subjectId})`);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" /> Curriculum Subject Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage academic subjects, subject IDs, codes, and automatically link to Class Grade models</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by subject name or ID..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Total Subjects: <span className="text-brand-600 dark:text-brand-400 font-black">{subjects.length}</span>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-6">Subject ID</th>
                <th className="py-3.5 px-6">Subject Name</th>
                <th className="py-3.5 px-6">Course Code</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginated.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400 dark:text-slate-500">No matching subjects found.</td></tr>
              ) : (
                paginated.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                    <td className="py-3.5 px-6 font-mono font-bold text-brand-600 dark:text-brand-400">{sub.subjectId}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{sub.name}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-400">{sub.code || sub.subjectId}</td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(sub)}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                          title="Edit Subject"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSubject(sub)}
                          className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors"
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

        {/* Footer Pagination */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Showing {paginated.length} of {filteredSubjects.length} subjects</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-bold text-slate-900 dark:text-white">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Add / Edit Subject Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSubject ? 'Edit Academic Subject' : 'Add New Academic Subject'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Subject ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUB-101"
                  value={formData.subjectId}
                  onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. MTH-101"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md">
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
        onConfirm={() => {
          if (deletingSubject) {
            deleteSubject(deletingSubject.id);
            addToast('success', 'Subject Deleted');
            setDeletingSubject(null);
          }
        }}
        onCancel={() => setDeletingSubject(null)}
      />
    </div>
  );
};
