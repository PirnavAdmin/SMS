import React from 'react';

export const DashboardShimmer: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 rounded-md shimmer-block" />
            <div className="h-3 w-32 rounded-md shimmer-block" />
          </div>
        </div>
        <div className="w-40 h-12 rounded-xl shimmer-block hidden md:block" />
      </div>

      {/* 4 Info Cards (Right to Left load) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl animate-rtl-load p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800 shadow-sm" style={{ animationDelay: '0ms' }}>
          <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-20 rounded-md shimmer-block" />
            <div className="h-6 w-12 rounded-md shimmer-block" />
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl animate-rtl-load p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800 shadow-sm" style={{ animationDelay: '100ms' }}>
          <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-24 rounded-md shimmer-block" />
            <div className="h-6 w-12 rounded-md shimmer-block" />
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl animate-rtl-load p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800 shadow-sm" style={{ animationDelay: '200ms' }}>
          <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-24 rounded-md shimmer-block" />
            <div className="h-6 w-12 rounded-md shimmer-block" />
          </div>
        </div>
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl animate-rtl-load p-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800 shadow-sm" style={{ animationDelay: '300ms' }}>
          <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-20 rounded-md shimmer-block" />
            <div className="h-6 w-12 rounded-md shimmer-block" />
          </div>
        </div>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Block 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl animate-rtl-load p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded-md shimmer-block" />
                <div className="h-3 w-24 rounded-md shimmer-block" />
              </div>
            </div>
            <div className="space-y-3 mt-2">
              <div className="h-4 w-full rounded-md shimmer-block" />
              <div className="h-4 w-11/12 rounded-md shimmer-block" />
              <div className="h-4 w-2/3 rounded-md shimmer-block" />
            </div>
          </div>

          {/* Block 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl animate-rtl-load p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded-md shimmer-block" />
                <div className="h-3 w-20 rounded-md shimmer-block" />
              </div>
            </div>
            <div className="space-y-3 mt-2">
              <div className="h-4 w-full rounded-md shimmer-block" />
              <div className="h-4 w-11/12 rounded-md shimmer-block" />
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Block 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl animate-rtl-load p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded-md shimmer-block" />
                <div className="h-3 w-24 rounded-md shimmer-block" />
              </div>
            </div>
            <div className="space-y-3 mt-2">
              <div className="h-4 w-full rounded-md shimmer-block" />
              <div className="h-4 w-11/12 rounded-md shimmer-block" />
              <div className="h-4 w-2/3 rounded-md shimmer-block" />
            </div>
          </div>

          {/* Block 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl animate-rtl-load p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4" style={{ animationDelay: '350ms' }}>
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="w-12 h-12 rounded-xl shimmer-block shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded-md shimmer-block" />
                <div className="h-3 w-24 rounded-md shimmer-block" />
              </div>
            </div>
            <div className="space-y-3 mt-2">
              <div className="h-4 w-full rounded-md shimmer-block" />
              <div className="h-4 w-11/12 rounded-md shimmer-block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
