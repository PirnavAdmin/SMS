import React, { useState } from 'react';
import { ShieldCheck, Plus, Edit, Trash2, CheckCircle2, XCircle, Users, Key, X, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UserRole, CustomRole, ModulePermissions } from '../../../types';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { validateRoleTitle } from '../../../utils/validation';
import { createSuperAdminApi } from '../../../api/superadmin';

export const UserManagementView: React.FC = () => {
  const { customRoles, addCustomRole, updateCustomRole, deleteCustomRole } = useData();
  const { addToast } = useToast();

  const defaultRoles: UserRole[] = [
    'Super Admin', 'Admin', 'Principal', 'HR', 'Accountant',
    'Teacher', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist'
  ];

  const modulesList = [
    'Student Management', 'Faculty & Staff', 'Admissions', 'Academics & Timetable',
    'Examination & Marks', 'Homework & Assignments', 'Fee Management', 'Library',
    'Transport', 'Hostel', 'Uniform Store', 'System Settings'
  ];

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<CustomRole | null>(null);
  const [roleTitleError, setRoleTitleError] = useState<string | undefined>(undefined);

  const [roleForm, setRoleForm] = useState<Partial<CustomRole>>({
    name: '',
    description: ''
  });

  // Super Admin creation modal state
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isSubmittingSa, setIsSubmittingSa] = useState(false);
  const [saForm, setSaForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: ''
  });

  // Matrix State for permissions
  const [permMatrix, setPermMatrix] = useState<Record<string, ModulePermissions>>(() => {
    const initial: Record<string, ModulePermissions> = {};
    modulesList.forEach(m => {
      initial[m] = { view: true, create: true, edit: true, delete: true, export: true, approve: true, assign: true };
    });
    return initial;
  });

  const handleTogglePerm = (mod: string, action: keyof ModulePermissions) => {
    setPermMatrix(prev => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [action]: !prev[mod]?.[action]
      }
    }));
    addToast('info', 'Permission Toggled', `Updated ${action} for ${mod}`);
  };

  const handleOpenAdd = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '' });
    setRoleTitleError(undefined);
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const titleRes = validateRoleTitle(roleForm.name || '', true);
    if (!titleRes.isValid) {
      setRoleTitleError(titleRes.error);
      addToast('error', 'Invalid Role Title', titleRes.error || 'Enter a valid role title.');
      return;
    }

    if (editingRole) {
      updateCustomRole(editingRole.id, { ...roleForm, name: roleForm.name!.trim(), permissions: permMatrix });
      addToast('success', 'Role Updated', `Updated permissions for ${roleForm.name}`);
    } else {
      addCustomRole({ name: roleForm.name!.trim(), description: roleForm.description || '', permissions: permMatrix });
      addToast('success', 'Role Created', `Created custom role ${roleForm.name}`);
    }
    setIsRoleModalOpen(false);
  };

  const handleCreateSuperAdmin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!saForm.fullName || !saForm.email || !saForm.mobileNumber || !saForm.password) {
      addToast('error', 'Missing Information', 'Please fill in all required fields.');
      return;
    }
    if (saForm.password.length < 6) {
      addToast('error', 'Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmittingSa(true);
    try {
      const res = await createSuperAdminApi({
        fullName: saForm.fullName.trim(),
        email: saForm.email.trim(),
        mobileNumber: saForm.mobileNumber.trim(),
        password: saForm.password
      });

      addToast('success', 'Super Admin Created', `Account created for ${res?.fullName || saForm.fullName} (${saForm.email})`);
      setIsSuperAdminModalOpen(false);
      setSaForm({ fullName: '', email: '', mobileNumber: '', password: '' });
    } catch (err: any) {
      const msg = err?.message || 'Failed to create Super Admin account.';
      addToast('error', 'Error', msg);
    } finally {
      setIsSubmittingSa(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-600" /> Roles & Access Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage system roles, custom permissions, and root Super Admin credentials
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSuperAdminModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" /> Create Super Admin
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Custom Role
          </button>
        </div>
      </div>

      {/* Role Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {defaultRoles.map(r => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedRole === r
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                : 'hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 mb-1 ${selectedRole === r ? 'text-brand-600' : 'text-slate-400'}`} />
            <p className="font-bold text-xs text-slate-900 dark:text-white">{r}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">System Role</p>
          </button>
        ))}
      </div>

      {/* Permission Matrix Table / Selection Prompt */}
      {selectedRole ? (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Granular Permission Matrix: <span className="text-brand-600">{selectedRole}</span>
              </h3>
              <p className="text-xs text-slate-500">Configure feature actions for each functional area</p>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 text-xs font-bold">
              Full Access Active
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-5 text-left text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider w-64 sm:w-80">
                    System Module
                  </th>
                  <th className="py-3.5 px-3 text-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    View
                  </th>
                  <th className="py-3.5 px-3 text-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Create
                  </th>
                  <th className="py-3.5 px-3 text-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Edit
                  </th>
                  <th className="py-3.5 px-3 text-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Delete
                  </th>
                  <th className="py-3.5 px-3 text-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Export
                  </th>
                  <th className="py-3.5 px-3 text-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Approve
                  </th>
                  <th className="py-3.5 px-3 text-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Assign
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {modulesList.map((mod) => {
                  const p = permMatrix[mod] || {
                    view: true,
                    create: true,
                    edit: true,
                    delete: true,
                    export: true,
                    approve: true,
                    assign: true,
                  };
                  return (
                    <tr
                      key={mod}
                      className="hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <td className="py-3.5 px-5 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {mod}
                      </td>
                      {(
                        [
                          "view",
                          "create",
                          "edit",
                          "delete",
                          "export",
                          "approve",
                          "assign",
                        ] as const
                      ).map((act) => (
                        <td key={act} className="py-3.5 px-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleTogglePerm(mod, act)}
                            title={`Toggle ${act} for ${mod}`}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center ${
                              p[act]
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/50 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/90 hover:scale-110 hover:shadow-xs"
                                : "text-slate-300 dark:text-slate-600 bg-transparent hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 hover:scale-110"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3 bg-white/50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Select a Role to View Permissions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Please select a system role from the cards above to inspect or configure its granular feature permissions.
          </p>
        </div>
      )}

      {/* Create Super Admin Modal */}
      {isSuperAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Super Admin</h3>
                  <p className="text-[11px] text-slate-500">Root system administrator account</p>
                </div>
              </div>
              <button
                onClick={() => setIsSuperAdminModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSuperAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Administrator"
                    value={saForm.fullName}
                    onChange={(e) => setSaForm({ ...saForm, fullName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="superadmin@pirnavschools.com"
                    value={saForm.email}
                    onChange={(e) => setSaForm({ ...saForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="9999999999"
                    value={saForm.mobileNumber}
                    onChange={(e) => setSaForm({ ...saForm, mobileNumber: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Password <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={saForm.password}
                    onChange={(e) => setSaForm({ ...saForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSuperAdminModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSa}
                  className="px-4 py-2 font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSubmittingSa ? 'Creating...' : 'Create Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Form Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Custom Role</h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Role Title <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vice Principal, IT Lead"
                  value={roleForm.name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoleForm({ ...roleForm, name: val });
                    const res = validateRoleTitle(val, false);
                    setRoleTitleError(res.error);
                  }}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                    roleTitleError ? "border-rose-500 focus:ring-rose-500" : ""
                  }`}
                />
                {roleTitleError && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {roleTitleError}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea rows={2} value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-brand-600 text-white rounded-xl">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
