import React, { useState } from 'react';
import { X, Key, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { changePassword, user } = useAuth();
  const { addToast } = useToast();

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [oldPassTouched, setOldPassTouched] = useState(false);
  const [newPassTouched, setNewPassTouched] = useState(false);
  const [confirmPassTouched, setConfirmPassTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setSubmitted(false);
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setErrorMessage(null);

    if (!oldPass || !newPass || !confirmPass) {
      return;
    }
    if (newPass.length < 6) {
      addToast('warning', 'Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      addToast('error', 'Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(oldPass, newPass);
      addToast('success', 'Password Updated', 'Your security password has been changed successfully in the database.');
      handleClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to update password. Please check your current password.';
      setErrorMessage(msg);
      addToast('error', 'Change Password Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
              <p className="text-xs text-slate-500">
                Update account password for {user?.email || user?.name || 'your profile'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showOldPass ? 'text' : 'password'}
                value={oldPass}
                onChange={e => {
                  setOldPass(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => setOldPassTouched(true)}
                placeholder="Enter current password"
                className={`w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white focus:outline-none transition-colors ${
                  (!oldPass && (oldPassTouched || submitted))
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-brand-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                tabIndex={-1}
                title={showOldPass ? "Hide password" : "Show password"}
                aria-label={showOldPass ? "Hide password" : "Show password"}
              >
                {showOldPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            {(!oldPass && (oldPassTouched || submitted)) && (
              <p className="text-xs text-red-500 font-medium mt-1">Current password is required</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                onBlur={() => setNewPassTouched(true)}
                placeholder="At least 6 characters"
                className={`w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white focus:outline-none transition-colors ${
                  ((!newPass || newPass.length < 6) && (newPassTouched || submitted))
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-brand-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                tabIndex={-1}
                title={showNewPass ? "Hide password" : "Show password"}
                aria-label={showNewPass ? "Hide password" : "Show password"}
              >
                {showNewPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            {(!newPass && (newPassTouched || submitted)) && (
              <p className="text-xs text-red-500 font-medium mt-1">New password is required</p>
            )}
            {newPass && newPass.length < 6 && (newPassTouched || submitted) && (
              <p className="text-xs text-red-500 font-medium mt-1">Password must be at least 6 characters</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                onBlur={() => setConfirmPassTouched(true)}
                placeholder="Confirm new password"
                className={`w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white focus:outline-none transition-colors ${
                  ((!confirmPass || confirmPass !== newPass) && (confirmPassTouched || submitted))
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-brand-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                tabIndex={-1}
                title={showConfirmPass ? "Hide password" : "Show password"}
                aria-label={showConfirmPass ? "Hide password" : "Show password"}
              >
                {showConfirmPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            {(!confirmPass && (confirmPassTouched || submitted)) && (
              <p className="text-xs text-red-500 font-medium mt-1">Please confirm your new password</p>
            )}
            {confirmPass && confirmPass !== newPass && (confirmPassTouched || submitted) && (
              <p className="text-xs text-red-500 font-medium mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
