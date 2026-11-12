import React, { useState, useEffect } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useTheme, DEFAULT_THEME } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  Palette,
  RotateCcw,
  Check,
  Sparkles,
  Sliders,
  X,
  Pipette,
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
  const { primary, secondary, updateColor, applyTheme, resetTheme } = useTheme();
  let addToast = null;
  try {
    const toast = useToast();
    addToast = toast?.addToast;
  } catch {
    // Optional toast
  }

  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'
  const [selectedPrimary, setSelectedPrimary] = useState(primary || DEFAULT_THEME.primary);
  const [selectedSecondary, setSelectedSecondary] = useState(secondary || DEFAULT_THEME.secondary);

  useEffect(() => {
    setSelectedPrimary(primary);
    setSelectedSecondary(secondary);
  }, [primary, secondary]);

  const isDefault =
    selectedPrimary?.toLowerCase() === DEFAULT_THEME.primary.toLowerCase() &&
    selectedSecondary?.toLowerCase() === DEFAULT_THEME.secondary.toLowerCase();

  const handlePrimaryChange = (hex) => {
    if (!hex) return;
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    setSelectedPrimary(cleanHex);
    updateColor('primary', cleanHex);
  };

  const handleSecondaryChange = (hex) => {
    if (!hex) return;
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    setSelectedSecondary(cleanHex);
    updateColor('secondary', cleanHex);
  };

  const handleSelectPreset = (p, s) => {
    setSelectedPrimary(p);
    setSelectedSecondary(s);
    if (applyTheme) {
      applyTheme(p, s);
    } else {
      updateColor('primary', p);
      updateColor('secondary', s);
    }
  };

  const handleApply = () => {
    if (applyTheme) {
      applyTheme(selectedPrimary, selectedSecondary);
    } else {
      updateColor('primary', selectedPrimary);
      updateColor('secondary', selectedSecondary);
    }

    if (addToast) {
      addToast('success', 'Theme Applied', 'New theme colors are now active across the application.');
    }

    if (onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    resetTheme();
    setSelectedPrimary(DEFAULT_THEME.primary);
    setSelectedSecondary(DEFAULT_THEME.secondary);
    if (addToast) {
      addToast('info', 'Theme Reset', 'Restored default school colors.');
    }
  };

  return (
    <div className={`p-6 space-y-5 animate-in fade-in select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--primary-color) 15%, transparent)',
              color: 'var(--primary-color)',
            }}
          >
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Theme & Colors
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a curated theme or pick custom brand colors
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-200">
          {PRESET_THEMES.map((preset) => {
            const isSelected =
              selectedPrimary?.toLowerCase() === preset.primary.toLowerCase() &&
              selectedSecondary?.toLowerCase() === preset.secondary.toLowerCase();

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.primary, preset.secondary)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/25 bg-sky-50/40 dark:bg-sky-950/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Dual Color Swatch */}
                <div className="h-6 rounded-lg flex overflow-hidden shadow-2xs border border-black/10 mb-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
          {/* Primary Picker */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shadow-2xs inline-block"
                  style={{ backgroundColor: selectedPrimary }}
                />
                Primary Color
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {selectedPrimary}
              </span>
            </div>

            {/* Picker */}
            <div className="w-full">
              <HexColorPicker
                color={selectedPrimary}
                onChange={handlePrimaryChange}
              />
            </div>

            {/* Quick Swatches */}
            <div className="flex items-center gap-1.5 justify-between pt-1">
              {PRIMARY_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handlePrimaryChange(hex)}
                  className={`w-5 h-5 rounded-full border border-black/10 transition-transform cursor-pointer hover:scale-120 ${
                    selectedPrimary.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-sky-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>

            {/* Hex Input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative group shrink-0">
                <input
                  type="color"
                  value={selectedPrimary.startsWith('#') && selectedPrimary.length === 7 ? selectedPrimary : '#0284c7'}
                  onChange={(e) => handlePrimaryChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  title="Native color picker"
                />
                <div
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: selectedPrimary }}
                >
                  <Pipette className="w-3 h-3 text-white mix-blend-difference opacity-80" />
                </div>
              </div>

              <div className="relative flex-1">
                <HexColorInput
                  color={selectedPrimary}
                  onChange={handlePrimaryChange}
                  prefixed
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-hidden uppercase"
                />
              </div>
            </div>
          </div>

          {/* Secondary Picker */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shadow-2xs inline-block"
                  style={{ backgroundColor: selectedSecondary }}
                />
                Secondary Accent
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {selectedSecondary}
              </span>
            </div>

            {/* Picker */}
            <div className="w-full">
              <HexColorPicker
                color={selectedSecondary}
                onChange={handleSecondaryChange}
              />
            </div>

            {/* Quick Swatches */}
            <div className="flex items-center gap-1.5 justify-between pt-1">
              {SECONDARY_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handleSecondaryChange(hex)}
                  className={`w-5 h-5 rounded-full border border-black/10 transition-transform cursor-pointer hover:scale-120 ${
                    selectedSecondary.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-amber-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>

            {/* Hex Input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative group shrink-0">
                <input
                  type="color"
                  value={selectedSecondary.startsWith('#') && selectedSecondary.length === 7 ? selectedSecondary : '#f59e0b'}
                  onChange={(e) => handleSecondaryChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  title="Native color picker"
                />
                <div
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: selectedSecondary }}
                >
                  <Pipette className="w-3 h-3 text-white mix-blend-difference opacity-80" />
                </div>
              </div>

              <div className="relative flex-1">
                <HexColorInput
                  color={selectedSecondary}
                  onChange={handleSecondaryChange}
                  prefixed
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-hidden uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Strip */}
      <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400">Live Preview:</span>
          {/* Mock active sidebar item */}
          <span
            className="px-2.5 py-1 rounded-lg text-white font-bold text-xs shadow-2xs transition-colors"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            Active Item
          </span>
          {/* Mock secondary accent badge */}
          <span
            className="px-2 py-0.5 rounded-full font-bold text-[11px] border shadow-2xs transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--secondary-color) 15%, transparent)',
              color: 'var(--secondary-color)',
              borderColor: 'color-mix(in srgb, var(--secondary-color) 35%, transparent)',
            }}
          >
            Accent Badge
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          <span style={{ color: selectedPrimary }}>● {selectedPrimary}</span>
          <span className="mx-1.5 text-slate-300 dark:text-slate-700">|</span>
          <span style={{ color: selectedSecondary }}>● {selectedSecondary}</span>
        </div>
      </div>

      {/* Clean Single Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          disabled={isDefault}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            isDefault
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-black text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-98"
            style={{
              backgroundColor: 'var(--primary-color)',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--primary-color) 35%, transparent)',
            }}
          >
            <Check className="w-4 h-4" />
            <span>Apply Theme</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
