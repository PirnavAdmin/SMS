import React, { useState } from 'react';
import { School, Plus, Edit, Trash2, X, BookOpen, Search, ChevronDown, Check } from 'lucide-react';
import { useData, AcademicClass } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Staff, SubjectItem } from '../../../types';

interface TeacherSearchSelectProps {
  value: string;
  onChange: (teacherName: string) => void;
  staff: Staff[];
}

const TeacherSearchSelect: React.FC<TeacherSearchSelectProps> = ({ value, onChange, staff }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedStaff = staff.find(s => `${s.firstName} ${s.lastName}` === value) || staff[0];

  const filteredStaff = staff.filter(s => {
    const query = searchTerm.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const empId = (s.empId || s.id || '').toLowerCase();
    const designation = (s.designation || '').toLowerCase();
    return fullName.includes(query) || empId.includes(query) || designation.includes(query);
  });

  return (
    <div className="relative inline-block text-left w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left shadow-sm"
      >
        <div className="truncate">
          <span>{value}</span>
          {selectedStaff?.empId && (
            <span className="text-[10px] text-brand-600 dark:text-brand-400 ml-1.5 font-mono">
              ({selectedStaff.empId})
            </span>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-2 animate-in fade-in">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              autoFocus
              placeholder="Search teacher by name or Emp ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
            {filteredStaff.length === 0 ? (
              <p className="text-[11px] text-slate-400 p-3 text-center">No matching staff found</p>
            ) : (
              filteredStaff.map(st => {
                const name = `${st.firstName} ${st.lastName}`;
                const isSelected = name === value;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{name}</span>
                        <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">({st.empId || st.id})</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{st.designation} • {st.department}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SubjectSearchMultiSelectProps {
  selectedSubjects: string[];
  onChange: (subjects: string[]) => void;
  subjects: SubjectItem[];
}

const SubjectSearchMultiSelect: React.FC<SubjectSearchMultiSelectProps> = ({
  selectedSubjects,
  onChange,
  subjects
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const availableSubjects = subjects.filter(s => {
    const query = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.subjectId.toLowerCase().includes(query) ||
      (s.code || '').toLowerCase().includes(query)
    );
  });

  const handleToggle = (name: string) => {
    if (selectedSubjects.includes(name)) {
      onChange(selectedSubjects.filter(s => s !== name));
    } else {
      onChange([...selectedSubjects, name]);
    }
  };

  const handleRemove = (name: string) => {
    onChange(selectedSubjects.filter(s => s !== name));
  };

  return (
    <div className="space-y-2">
      {/* Selected Subject Pills */}
      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {selectedSubjects.length === 0 ? (
          <span className="text-[11px] text-slate-400 font-normal self-center">No subjects assigned yet</span>
        ) : (
          selectedSubjects.map(subName => (
            <span
              key={subName}
              className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center gap-1 border border-brand-200 dark:border-brand-800"
            >
              {subName}
              <button
                type="button"
                onClick={() => handleRemove(subName)}
                className="hover:text-rose-500 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Dropdown Opener Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-750 transition-all text-left shadow-sm"
        >
          <span className="text-slate-500 dark:text-slate-400">Search & Select Subjects from Linked Subjects Module...</span>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-2 animate-in fade-in">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                autoFocus
                placeholder="Search subject by name or ID (e.g. Mathematics, SUB-101)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
              {availableSubjects.length === 0 ? (
                <p className="text-[11px] text-slate-400 p-3 text-center">No matching subjects in Subjects module</p>
              ) : (
                availableSubjects.map(sub => {
                  const isSelected = selectedSubjects.includes(sub.name);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleToggle(sub.name)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-brand-600 dark:text-brand-400 font-bold">{sub.subjectId}</span>
                        <span className="font-bold">{sub.name}</span>
                        {sub.code && <span className="text-[10px] text-slate-400 font-mono">({sub.code})</span>}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AcademicsView: React.FC = () => {
  const { academicClasses, addAcademicClass, updateAcademicClass, deleteAcademicClass, staff, subjects } = useData();
  const { addToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<AcademicClass | null>(null);
  const [newSectionInput, setNewSectionInput] = useState<{ [classId: string]: string }>({});

  const [formData, setFormData] = useState<Partial<AcademicClass>>({
    name: '',
    sections: ['A', 'B'],
    sectionTeachers: { 'A': 'Sarah Jenkins', 'B': 'Jonathan Miller' },
    teacher: 'Sarah Jenkins',
    subjects: ['Mathematics', 'Physics', 'English']
  });

  const handleOpenAdd = () => {
    setEditingClass(null);
    const defaultTeacherName = staff[0]?.firstName ? `${staff[0].firstName} ${staff[0].lastName}` : 'Jonathan Miller';
    setFormData({
      name: '',
      sections: ['A', 'B'],
      sectionTeachers: { 'A': defaultTeacherName, 'B': defaultTeacherName },
      teacher: defaultTeacherName,
      subjects: ['Mathematics', 'Physics', 'English']
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cls: AcademicClass) => {
    setEditingClass(cls);
    const defaultTeacherName = staff[0]?.firstName ? `${staff[0].firstName} ${staff[0].lastName}` : 'Jonathan Miller';
    const initialTeachers: Record<string, string> = {};
    (cls.sections || ['A', 'B']).forEach(sec => {
      initialTeachers[sec] = cls.sectionTeachers?.[sec] || cls.teacher || defaultTeacherName;
    });

    setFormData({
      ...cls,
      sectionTeachers: initialTeachers
    });
    setIsFormOpen(true);
  };

  const handleSectionsChange = (sectionsStr: string) => {
    const parsedSections = sectionsStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const defaultTeacherName = staff[0]?.firstName ? `${staff[0].firstName} ${staff[0].lastName}` : 'Jonathan Miller';

    const updatedSectionTeachers: Record<string, string> = { ...(formData.sectionTeachers || {}) };
    parsedSections.forEach(sec => {
      if (!updatedSectionTeachers[sec]) {
        updatedSectionTeachers[sec] = formData.teacher || defaultTeacherName;
      }
    });

    setFormData({
      ...formData,
      sections: parsedSections,
      sectionTeachers: updatedSectionTeachers
    });
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingClass) {
      updateAcademicClass(editingClass.id, formData);
      addToast('success', 'Class Updated', `Updated ${formData.name}`);
    } else {
      addAcademicClass(formData as Omit<AcademicClass, 'id'>);
      addToast('success', 'Class Created', `Created ${formData.name}`);
    }
    setIsFormOpen(false);
  };

  const handleAddSection = (classId: string) => {
    const cls = academicClasses.find(c => c.id === classId);
    if (!cls) return;

    let sectionName = (newSectionInput[classId] || '').trim().toUpperCase();

    // Auto-generate next section letter if input is empty
    if (!sectionName) {
      const lastChar = cls.sections[cls.sections.length - 1] || 'A';
      if (lastChar.length === 1 && lastChar >= 'A' && lastChar < 'Z') {
        sectionName = String.fromCharCode(lastChar.charCodeAt(0) + 1);
      } else {
        sectionName = `SEC-${cls.sections.length + 1}`;
      }
    }

    if (cls.sections.includes(sectionName)) {
      addToast('warning', 'Duplicate Section', `Section ${sectionName} already exists in ${cls.name}`);
      return;
    }

    const updatedSections = [...cls.sections, sectionName];
    const defaultTeacher = staff[0]?.firstName ? `${staff[0].firstName} ${staff[0].lastName}` : 'Jonathan Miller';
    const updatedTeachers = {
      ...(cls.sectionTeachers || {}),
      [sectionName]: defaultTeacher
    };

    updateAcademicClass(classId, {
      sections: updatedSections,
      sectionTeachers: updatedTeachers
    });

    setNewSectionInput(prev => ({ ...prev, [classId]: '' }));
    addToast('success', 'Section Added', `Added Section ${sectionName} to ${cls.name}`);
  };

  const handleDeleteSection = (classId: string, sectionToDelete: string) => {
    const cls = academicClasses.find(c => c.id === classId);
    if (!cls) return;

    if (cls.sections.length <= 1) {
      addToast('warning', 'Cannot Delete Section', 'A class must have at least one section.');
      return;
    }

    const updatedSections = cls.sections.filter(s => s !== sectionToDelete);
    const updatedTeachers = { ...(cls.sectionTeachers || {}) };
    delete updatedTeachers[sectionToDelete];

    updateAcademicClass(classId, {
      sections: updatedSections,
      sectionTeachers: updatedTeachers
    });

    addToast('info', 'Section Removed', `Removed Section ${sectionToDelete} from ${cls.name}`);
  };

  const handleAssignSectionTeacher = (classId: string, sectionName: string, teacherName: string) => {
    const cls = academicClasses.find(c => c.id === classId);
    if (!cls) return;

    const updatedTeachers = {
      ...(cls.sectionTeachers || {}),
      [sectionName]: teacherName
    };

    updateAcademicClass(classId, {
      sectionTeachers: updatedTeachers
    });

    addToast('success', 'Teacher Assigned', `Assigned ${teacherName} as Class Teacher for ${cls.name} Section ${sectionName}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <School className="w-6 h-6 text-brand-600 dark:text-brand-400" /> Academic Setup & Class Model Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure classes, add/delete sections, and assign individual section class teachers</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Class Grade
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {academicClasses.map(cl => (
          <div key={cl.id} className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{cl.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Sections: <span className="font-bold text-brand-600 dark:text-brand-400">{cl.sections.length}</span></p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(cl)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-colors"
                  title="Edit Class Details"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingClass(cl)}
                  className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors"
                  title="Delete Class Grade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Section Management & Searchable Teacher Dropdown Assignment */}
            <div className="space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                SECTION MANAGEMENT & CLASS TEACHER DROPDOWNS
              </p>

              <div className="space-y-3">
                {cl.sections.map(s => {
                  const currentTeacher = cl.sectionTeachers?.[s] || cl.teacher || 'Jonathan Miller';
                  return (
                    <div
                      key={s}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 w-full text-xs"
                    >
                      {/* SINGLE Section Label */}
                      <span className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-black text-xs shadow-sm whitespace-nowrap shrink-0">
                        Section {s}
                      </span>

                      {/* Dropdown Alignment & Searchable Teacher Select */}
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 hidden 2xl:inline whitespace-nowrap">
                          Class Teacher:
                        </span>
                        <div className="flex-1 max-w-[220px] min-w-[120px]">
                          <TeacherSearchSelect
                            value={currentTeacher}
                            onChange={teacherName => handleAssignSectionTeacher(cl.id, s, teacherName)}
                            staff={staff}
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteSection(cl.id, s)}
                          className="p-1.5 sm:p-2 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors shrink-0"
                          title={`Delete Section ${s}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Section Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="New Section Name (e.g. C)"
                  value={newSectionInput[cl.id] || ''}
                  onChange={e => setNewSectionInput({ ...newSectionInput, [cl.id]: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSection(cl.id);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none w-48 font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleAddSection(cl.id)}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center gap-1 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              </div>
            </div>

            {/* Curriculum Subjects */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Curriculum Subjects</p>
              <div className="flex flex-wrap gap-1.5">
                {cl.subjects.map(sub => (
                  <span key={sub} className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Class Modal with Fixed Layout & Unclipped Popovers */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingClass ? 'Edit Academic Class' : 'Add New Academic Class Grade'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content (Zero clipping for floating popovers) */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1.5 space-y-4 py-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class Grade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 8"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Sections (Comma separated)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentSecs = formData.sections || ['A', 'B'];
                      const lastChar = currentSecs[currentSecs.length - 1] || 'A';
                      let nextSec = 'C';
                      if (lastChar.length === 1 && lastChar >= 'A' && lastChar < 'Z') {
                        nextSec = String.fromCharCode(lastChar.charCodeAt(0) + 1);
                      } else {
                        nextSec = `SEC-${currentSecs.length + 1}`;
                      }
                      handleSectionsChange([...currentSecs, nextSec].join(', '));
                    }}
                    className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Quick Add Next Section
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.sections?.join(', ')}
                  onChange={e => handleSectionsChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>

              {/* Class Teacher Assignment Per Section (Unclipped Overflow) */}
              {formData.sections && formData.sections.length > 0 && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Assign Class Teacher Per Section *
                  </label>
                  <div className="space-y-2.5">
                    {formData.sections.map(sec => {
                      const defaultTeacherName = staff[0]?.firstName ? `${staff[0].firstName} ${staff[0].lastName}` : 'Jonathan Miller';
                      const assignedTeacher = formData.sectionTeachers?.[sec] || formData.teacher || defaultTeacherName;
                      return (
                        <div key={sec} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <span className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-black text-xs shrink-0 shadow-sm">
                            Section {sec}
                          </span>
                          <TeacherSearchSelect
                            value={assignedTeacher}
                            onChange={teacherName => {
                              setFormData(prev => ({
                                ...prev,
                                sectionTeachers: {
                                  ...(prev.sectionTeachers || {}),
                                  [sec]: teacherName
                                }
                              }));
                            }}
                            staff={staff}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Linked Searchable Multi-Select for Subjects from Subjects Module */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Curriculum Subjects (Linked to Subjects Module) *
                </label>
                <SubjectSearchMultiSelect
                  selectedSubjects={formData.subjects || []}
                  onChange={subs => setFormData({ ...formData, subjects: subs })}
                  subjects={subjects}
                />
              </div>

              {/* Sticky Modal Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md transition-all">
                  {editingClass ? 'Save Changes' : 'Create Class Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingClass}
        title="Delete Academic Class Grade"
        message={`Are you sure you want to delete ${deletingClass?.name}?`}
        onConfirm={() => {
          if (deletingClass) {
            deleteAcademicClass(deletingClass.id);
            addToast('success', 'Class Grade Deleted');
            setDeletingClass(null);
          }
        }}
        onCancel={() => setDeletingClass(null)}
      />
    </div>
  );
};
