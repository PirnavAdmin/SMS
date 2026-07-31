import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TransportTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface TransportScrollableTabsProps {
  tabs: readonly TransportTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  title?: string;
  subtitle?: string;
  className?: string;
  sticky?: boolean;
}

export const TransportScrollableTabs: React.FC<TransportScrollableTabsProps> = ({
  tabs,
  activeId,
  onChange,
  title,
  subtitle,
  className = '',
  sticky = false
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const node = trackRef.current;
    if (!node) return;

    const { scrollLeft, scrollWidth, clientWidth } = node;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();

    const node = trackRef.current;
    if (!node) return undefined;

    node.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      node.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [tabs.length]);

  useEffect(() => {
    updateScrollState();

    const node = trackRef.current;
    if (!node) return;

    const activeButton = node.querySelector<HTMLButtonElement>(`button[data-tab-id="${activeId}"]`);
    activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeId, tabs.length]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const node = trackRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth'
    });
  };

  return (
    <div
      className={[
        sticky ? 'sticky top-20 z-30' : '',
        'glass-card p-1.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm',
        className
      ].join(' ')}
    >
      {(title || subtitle) && (
        <div className="flex items-start justify-between gap-4 px-1.5 pb-2">
          <div>
            {title && <h3 className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">{title}</h3>}
            {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div ref={trackRef} className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeId === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  data-tab-id={tab.id}
                  onClick={() => onChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-sky-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TransportScrollableTabs;
