import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, Palette, Moon, Sun, Search, Sparkles, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface FloatingQuickActionDockProps {
  onOpenSearch?: () => void;
  onOpenTheme?: () => void;
}

export const FloatingQuickActionDock: React.FC<FloatingQuickActionDockProps> = ({
  onOpenSearch,
  onOpenTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const dockRef = useRef<HTMLDivElement>(null);

  // Monitor scroll depth to show / emphasize scroll-to-top
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 240) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    setIsOpen(false);
  };

  return (
    <div
      ref={dockRef}
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end gap-2 print:hidden select-none"
    >
      {/* Rolled out Speed Dial Stack */}
      {isOpen && (
        <div className="flex flex-col items-end gap-1.5 mb-0.5 animate-rollout origin-bottom">
          {/* Scroll to Top */}
          <div className="flex items-center gap-1.5 group">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg glass-card text-slate-700 dark:text-slate-200 border-primary-interactive shadow-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Scroll to Top
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              title="Scroll to Top"
              className={`w-8 h-8 rounded-full glass-card border-primary-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[var(--primary-color)] dark:hover:text-white hover-tilt shadow-sm cursor-pointer transition-all ${
                showScrollTop ? 'pulse-primary' : ''
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          {/* Quick Search */}
          {onOpenSearch && (
            <div className="flex items-center gap-1.5 group">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg glass-card text-slate-700 dark:text-slate-200 border-primary-interactive shadow-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Global Search (Ctrl+K)
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSearch();
                }}
                title="Search anything"
                className="w-8 h-8 rounded-full glass-card border-primary-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[var(--primary-color)] dark:hover:text-white hover-tilt shadow-sm cursor-pointer transition-all"
              >
                <Search className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          )}

          {/* Theme Studio / Customizer */}
          {onOpenTheme && (
            <div className="flex items-center gap-1.5 group">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg glass-card text-slate-700 dark:text-slate-200 border-primary-interactive shadow-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Theme Studio
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenTheme();
                }}
                title="Customize Theme Colors"
                className="w-8 h-8 rounded-full glass-card border-primary-interactive flex items-center justify-center text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover-tilt shadow-sm cursor-pointer transition-all"
              >
                <Palette className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          )}

          {/* Dark / Light Mode Flip Toggle */}
          <div className="flex items-center gap-1.5 group">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg glass-card text-slate-700 dark:text-slate-200 border-primary-interactive shadow-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </span>
            <button
              type="button"
              onClick={() => {
                toggleDarkMode();
              }}
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              className="w-8 h-8 rounded-full glass-card border-primary-interactive flex items-center justify-center text-slate-700 dark:text-amber-400 hover:text-[var(--primary-color)] dark:hover:text-amber-300 hover-tilt shadow-sm cursor-pointer transition-all"
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 stroke-[2.2] animate-flip-y" />
              ) : (
                <Moon className="w-3.5 h-3.5 stroke-[2.2] animate-flip-y" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Hub Pill Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Quick Actions Hub"
        className={`group relative h-8 w-8 sm:h-9 sm:w-9 rounded-full btn-glass-primary flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 ${
          isOpen ? 'rotate-90 scale-105' : 'hover:scale-105'
        }`}
      >
        {/* Subtle Ambient Primary Halo */}
        <div className="absolute inset-0 rounded-full bg-[var(--primary-color)] opacity-30 blur-md group-hover:opacity-60 transition-opacity pointer-events-none" />

        <div className="relative z-10 text-white">
          {isOpen ? (
            <X className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <Sparkles className="w-4 h-4 stroke-[2.2] transition-transform group-hover:rotate-12" />
          )}
        </div>
      </button>
    </div>
  );
};
export default FloatingQuickActionDock;