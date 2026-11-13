import React, { useState, useEffect, useMemo } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useTheme, DEFAULT_THEME } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Palette,
  RotateCcw,
  Check,
  Sparkles,
  Sliders,
  X,
  Pipette,
  Globe,
  User,
  Shield,
} from 'lucide-react';

const PRESET_THEMES = [
  {
    id: 'ocean-sun',
    name: 'Sky & Amber',
    description: 'Default Theme',
    primary: '#0284c7',
    secondary: '#f59e0b',
  },
  {
    id: 'emerald-coral',
    name: 'Emerald & Coral',
    description: 'Fresh & Vibrant',
    primary: '#059669',
    secondary: '#f43f5e',
  },
  {
    id: 'indigo-pink',
    name: 'Indigo & Pink',
    description: 'Modern & Creative',
    primary: '#4f46e5',
    secondary: '#ec4899',
  },
  {
    id: 'royal-gold',
    name: 'Royal & Gold',
    description: 'Prestigious & Bold',
    primary: '#7c3aed',
    secondary: '#eab308',
  },
  {
    id: 'midnight-cyan',
    name: 'Midnight & Cyan',
    description: 'High Contrast',
    primary: '#0f172a',
    secondary: '#06b6d4',
  },
  {
    id: 'crimson-slate',
    name: 'Crimson & Slate',
    description: 'Classic & Strong',
    primary: '#dc2626',
    secondary: '#64748b',
  },
  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    description: 'Warm & Active',
    primary: '#0d9488',
    secondary: '#ea580c',
  },
  {
    id: 'blue-violet',
    name: 'Blue & Violet',
    description: 'Cool Harmony',
    primary: '#2563eb',
    secondary: '#8b5cf6',
  },
];

const PRIMARY_SWATCHES = ['#0284c7', '#059669', '#4f46e5', '#7c3aed', '#dc2626', '#0f172a'];
const SECONDARY_SWATCHES = ['#f59e0b', '#f43f5e', '#ec4899', '#eab308', '#06b6d4', '#64748b'];

export const ThemeCustomizer = ({ className = '', onClose = undefined }) => {
  const {
    primary,
    secondary,
    schoolDefaultTheme,
    isUserOverride,
    applySchoolDefaultTheme,
    applyUserTheme,
    resetUserTheme,
    resetSchoolDefaultTheme,
    applyTheme,
    resetTheme,
  } = useTheme();

  let authUser = null;
  let authRole = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
    authRole = auth?.role;
  } catch {
    // If mounted outside AuthProvider
  }

  let addToast = null;
  try {
    const toast = useToast();
    addToast = toast?.addToast;
  } catch {
    // Optional toast
  }

  // Detect whether active user has administrative rights to configure School Default Theme
  const isAdmin = useMemo(() => {
    if (authRole === 'Admin' || authRole === 'Super Admin') return true;
    if (authUser?.role === 'Admin' || authUser?.role === 'Super Admin') return true;
    if (
      authUser?.email &&
      (authUser.email.toLowerCase().includes('admin') ||
        authUser.email.toLowerCase().includes('pirnavsms'))
    ) {
      return true;
    }
    try {
      const saved = localStorage.getItem('auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const r = (parsed?.role || '').toLowerCase().replace(/[_\s-]+/g, '');
        if (r === 'admin' || r === 'superadmin') return true;
      }
    } catch {}
    return false;
  }, [authRole, authUser]);

  // Target Scope: 'school' (all users default) or 'personal' (current user screen only)
  const [applyScope, setApplyScope] = useState(isAdmin ? 'school' : 'personal');

  useEffect(() => {
    setApplyScope(isAdmin ? 'school' : 'personal');
  }, [isAdmin]);

  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'
  const [selectedPrimary, setSelectedPrimary] = useState(primary || DEFAULT_THEME.primary);
  const [selectedSecondary, setSelectedSecondary] = useState(secondary || DEFAULT_THEME.secondary);

  // Sync state if context primary/secondary changes externally
  useEffect(() => {
    if (primary) setSelectedPrimary(primary);
    if (secondary) setSelectedSecondary(secondary);
  }, [primary, secondary]);

  const handlePrimaryChange = (hex) => {
    if (!hex) return;
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    setSelectedPrimary(cleanHex);
  };

  const handleSecondaryChange = (hex) => {
    if (!hex) return;
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    setSelectedSecondary(cleanHex);
  };

  const handleSelectPreset = (p, s) => {
    setSelectedPrimary(p);
    setSelectedSecondary(s);
  };

  // Determine if Reset button should be disabled
  const isResetDisabled = useMemo(() => {
    if (isAdmin && applyScope === 'school') {
      const activeSchoolPrimary = (schoolDefaultTheme?.primary || DEFAULT_THEME.primary).toLowerCase();
      const activeSchoolSecondary = (schoolDefaultTheme?.secondary || DEFAULT_THEME.secondary).toLowerCase();
      const isAlreadyDefault =
        selectedPrimary?.toLowerCase() === DEFAULT_THEME.primary.toLowerCase() &&
        selectedSecondary?.toLowerCase() === DEFAULT_THEME.secondary.toLowerCase() &&
        activeSchoolPrimary === DEFAULT_THEME.primary.toLowerCase() &&
        activeSchoolSecondary === DEFAULT_THEME.secondary.toLowerCase();
      return isAlreadyDefault;
    }

    const schoolP = (schoolDefaultTheme?.primary || DEFAULT_THEME.primary).toLowerCase();
    const schoolS = (schoolDefaultTheme?.secondary || DEFAULT_THEME.secondary).toLowerCase();
    const matchesSchool =
      selectedPrimary?.toLowerCase() === schoolP &&
      selectedSecondary?.toLowerCase() === schoolS;

    return !isUserOverride && matchesSchool;
  }, [isAdmin, applyScope, selectedPrimary, selectedSecondary, schoolDefaultTheme, isUserOverride]);

  const resetLabel = useMemo(() => {
    if (isAdmin && applyScope === 'school') {
      return 'Reset School Default';
    }
    return isUserOverride ? 'Reset to School Default' : 'Reset Defaults';
  }, [isAdmin, applyScope, isUserOverride]);

  const applyLabel = useMemo(() => {
    if (isAdmin && applyScope === 'school') {
      return 'Apply as School Default';
    }
    return 'Apply to My Screen';
  }, [isAdmin, applyScope]);

  const handleApply = () => {
    if (isAdmin && applyScope === 'school') {
      // 1. Admin applies School-wide default theme (displays to ALL users by default)
      if (applySchoolDefaultTheme) {
        applySchoolDefaultTheme(selectedPrimary, selectedSecondary);
      } else if (applyTheme) {
        applyTheme(selectedPrimary, selectedSecondary);
      }

      if (addToast) {
        addToast(
          'success',
          'School Default Theme Applied',
          'Theme updated. Visible to all students, staff, and parents by default.'
        );
      }
    } else {
      // 2. User applies personal theme (applies strictly within this user's screen)
      if (applyUserTheme) {
        applyUserTheme(selectedPrimary, selectedSecondary);
      } else if (applyTheme) {
        applyTheme(selectedPrimary, selectedSecondary);
      }

      if (addToast) {
        addToast(
          'success',
          'Personal Theme Applied',
          'Saved to your screen only. Other users will not be affected.'
        );
      }
    }

    if (onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    if (isAdmin && applyScope === 'school') {
      // Admin resets school default back to Sky & Amber
      if (resetSchoolDefaultTheme) {
        resetSchoolDefaultTheme();
      } else if (resetTheme) {
        resetTheme();
      }
      setSelectedPrimary(DEFAULT_THEME.primary);
      setSelectedSecondary(DEFAULT_THEME.secondary);
      if (addToast) {
        addToast('info', 'School Theme Reset', 'Restored default school colors (Sky & Amber) for all users.');
      }
    } else {
      // Regular user resets personal override -> reverts back to school default theme
      if (resetUserTheme) {
        resetUserTheme();
      } else if (resetTheme) {
        resetTheme();
      }
      const schoolTheme = schoolDefaultTheme || DEFAULT_THEME;
      setSelectedPrimary(schoolTheme.primary);
      setSelectedSecondary(schoolTheme.secondary);
      if (addToast) {
        addToast('info', 'Personal Theme Cleared', 'Restored the school default theme set by administration.');
      }
    }
  };

  return (
    <div className={`p-6 sm:p-7 space-y-5 select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-colors"
            style={{
              backgroundColor: `color-mix(in srgb, ${selectedPrimary} 15%, transparent)`,
              color: selectedPrimary,
            }}
          >
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Theme & Colors
              </h3>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Shield className="w-3 h-3" />
                  Admin Studio
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <User className="w-3 h-3" />
                  Personal Screen
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin
                ? 'Configure school-wide default theme or personalize your own screen'
                : 'Personalize your workspace colors (applies to your screen only)'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Target Scope Banner / Selector */}
      {isAdmin ? (
        <div className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Target Scope:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    applyScope === 'school'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {applyScope === 'school' ? 'School Default (All Users)' : 'My Screen Only'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {applyScope === 'school'
                  ? 'Displays to all students, teachers, parents & staff by default.'
                  : 'Applies within your screen only. Other users will not see this change.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setApplyScope('school')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                applyScope === 'school'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              School Default
            </button>
            <button
              type="button"
              onClick={() => setApplyScope('personal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                applyScope === 'personal'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Screen Only
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Personal Screen Theme
              </span>
              {isUserOverride ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Customized
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  Using School Default
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Theme changes apply strictly within your screen. The school default set by administrators remains unchanged.
            </p>
          </div>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Curated Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'custom'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-sky-500" />
          <span>Custom Pickers</span>
        </button>
      </div>

      {/* Tab 1: Curated Presets View */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {PRESET_THEMES.map((preset) => {
            const isSelected =
              selectedPrimary?.toLowerCase() === preset.primary.toLowerCase() &&
              selectedSecondary?.toLowerCase() === preset.secondary.toLowerCase();

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.primary, preset.secondary)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/25 bg-sky-50/40 dark:bg-sky-950/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Dual Color Swatch */}
                <div className="h-6 rounded-lg flex overflow-hidden shadow-2xs border border-black/10 mb-2.5">
                  <div className="w-1/2 h-full" style={{ backgroundColor: preset.primary }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: preset.secondary }} />
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {preset.name}
                  </p>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 2: Custom Color Pickers View */}
      {activeTab === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Primary Picker Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs inline-block transition-colors"
                  style={{ backgroundColor: selectedPrimary }}
                />
                Primary Color
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                {selectedPrimary}
              </span>
            </div>

            {/* Color Canvas & Hue Slider */}
            <div className="w-full">
              <HexColorPicker
                color={selectedPrimary}
                onChange={handlePrimaryChange}
              />
            </div>

            {/* Quick Swatches */}
            <div className="flex items-center gap-2 justify-between pt-1">
              {PRIMARY_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handlePrimaryChange(hex)}
                  className={`w-6 h-6 rounded-full border border-black/10 transition-transform cursor-pointer hover:scale-115 ${
                    selectedPrimary.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-sky-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>

            {/* Hex Input & Eyedropper */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="relative group shrink-0" title="Native color picker">
                <input
                  type="color"
                  value={selectedPrimary.startsWith('#') && selectedPrimary.length === 7 ? selectedPrimary : '#0284c7'}
                  onChange={(e) => handlePrimaryChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: selectedPrimary }}
                >
                  <Pipette className="w-3.5 h-3.5 text-white mix-blend-difference opacity-90" />
                </div>
              </div>

              <div className="relative flex-1">
                <HexColorInput
                  color={selectedPrimary}
                  onChange={handlePrimaryChange}
                  prefixed
                  className="w-full h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-hidden uppercase"
                />
              </div>
            </div>
          </div>

          {/* Secondary Picker Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs inline-block transition-colors"
                  style={{ backgroundColor: selectedSecondary }}
                />
                Secondary Accent
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                {selectedSecondary}
              </span>
            </div>

            {/* Color Canvas & Hue Slider */}
            <div className="w-full">
              <HexColorPicker
                color={selectedSecondary}
                onChange={handleSecondaryChange}
              />
            </div>

            {/* Quick Swatches */}
            <div className="flex items-center gap-2 justify-between pt-1">
              {SECONDARY_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handleSecondaryChange(hex)}
                  className={`w-6 h-6 rounded-full border border-black/10 transition-transform cursor-pointer hover:scale-115 ${
                    selectedSecondary.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-amber-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>

            {/* Hex Input & Eyedropper */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="relative group shrink-0" title="Native color picker">
                <input
                  type="color"
                  value={selectedSecondary.startsWith('#') && selectedSecondary.length === 7 ? selectedSecondary : '#f59e0b'}
                  onChange={(e) => handleSecondaryChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: selectedSecondary }}
                >
                  <Pipette className="w-3.5 h-3.5 text-white mix-blend-difference opacity-90" />
                </div>
              </div>

              <div className="relative flex-1">
                <HexColorInput
                  color={selectedSecondary}
                  onChange={handleSecondaryChange}
                  prefixed
                  className="w-full h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-hidden uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Strip */}
      <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400">Live Preview:</span>
          {/* Mock active navigation item */}
          <span
            className="px-3 py-1 rounded-xl text-white font-bold text-xs shadow-2xs transition-colors"
            style={{ backgroundColor: selectedPrimary }}
          >
            Active Item
          </span>
          {/* Mock secondary accent badge */}
          <span
            className="px-2.5 py-0.5 rounded-full font-bold text-[11px] border shadow-2xs transition-colors"
            style={{
              backgroundColor: `color-mix(in srgb, ${selectedSecondary} 15%, transparent)`,
              color: selectedSecondary,
              borderColor: `color-mix(in srgb, ${selectedSecondary} 35%, transparent)`,
            }}
          >
            Accent Badge
          </span>
        </div>

        <div className="text-[11px] font-mono font-bold text-slate-400">
          <span style={{ color: selectedPrimary }}>● {selectedPrimary}</span>
          <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
          <span style={{ color: selectedSecondary }}>● {selectedSecondary}</span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetDisabled}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
            isResetDisabled
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
              : 'btn-glass-secondary text-slate-600 dark:text-slate-300'
          }`}
          title={resetLabel}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetLabel}</span>
        </button>

        <div className="flex items-center gap-2.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-semibold btn-glass-secondary text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2.5 rounded-2xl text-xs font-black text-white btn-glass-primary shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
            style={{
              backgroundColor: selectedPrimary,
            }}
          >
            <Check className="w-4 h-4" />
            <span>{applyLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
