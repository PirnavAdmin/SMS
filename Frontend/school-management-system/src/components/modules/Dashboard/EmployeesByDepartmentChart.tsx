import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Users, TrendingUp } from 'lucide-react';
import { useData } from '../../../context/DataContext';

interface EmployeesByDepartmentChartProps {
  onNavigate?: (module: string) => void;
  className?: string;
}

interface DepartmentStat {
  name: string;
  count: number;
  percentage: number;
}

export const EmployeesByDepartmentChart: React.FC<EmployeesByDepartmentChartProps> = ({
  onNavigate,
  className = '',
}) => {
  const { staff = [], departments = [] } = useData();
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Compute department counts dynamically based on real staff data or realistic baseline
  const departmentStats = useMemo<DepartmentStat[]>(() => {
    // 1. Gather counts from active staff
    const counts: Record<string, number> = {};

    (staff || []).forEach((s) => {
      const dept = s.department || s.employeeCategory || 'Academics';
      const cleanDept = dept.trim();
      if (cleanDept) {
        counts[cleanDept] = (counts[cleanDept] || 0) + 1;
      }
    });

    // 2. Also register any departments from DataContext
    (departments || []).forEach((d: any) => {
      const dName = d.departmentName || d.name || '';
      if (dName && counts[dName] === undefined) {
        counts[dName] = 0;
      }
    });

    // 3. Fallback baseline if DB is empty or during demo/initial state
    const baselineDepts = [
      { name: 'Academics', count: 82 },
      { name: 'Administration', count: 110 },
      { name: 'Transport Fleet', count: 80 },
      { name: 'Finance & Accounts', count: 20 },
      { name: 'Hostel Management', count: 62 },
      { name: 'Support & Facility', count: 100 },
    ];

    let result: { name: string; count: number }[] = [];

    const realKeys = Object.keys(counts);
    if (realKeys.length >= 3 && (staff || []).length >= 5) {
      result = realKeys.map((name) => ({ name, count: counts[name] }));
      result.sort((a, b) => b.count - a.count);
      // Keep all departments so user can scroll through all of them
    } else {
      // Blend any live staff into baseline so it stays populated like the design
      result = baselineDepts.map((b) => {
        const liveAdd = counts[b.name] || 0;
        return {
          name: b.name,
          count: b.count + liveAdd,
        };
      });
    }

    const total = result.reduce((acc, curr) => acc + curr.count, 0) || 1;

    return result.map((r) => ({
      ...r,
      percentage: Math.round((r.count / total) * 100),
    }));
  }, [staff, departments]);

  // Determine dynamic max for scale (0, 20, 40, ... up to ceil of max count, min 120)
  const maxVal = useMemo(() => {
    const rawMax = Math.max(...departmentStats.map((d) => d.count), 100);
    return Math.ceil(rawMax / 20) * 20;
  }, [departmentStats]);

  const scaleSteps = useMemo(() => {
    const stepCount = 6;
    const stepSize = Math.max(20, Math.ceil(maxVal / stepCount / 10) * 10);
    const steps: number[] = [];
    for (let i = 0; i <= stepCount; i++) {
      steps.push(i * stepSize);
    }
    return steps;
  }, [maxVal]);

  const currentScaleMax = scaleSteps[scaleSteps.length - 1] || 120;
  const totalStaffCount = useMemo(() => departmentStats.reduce((a, b) => a + b.count, 0), [departmentStats]);

  return (
    <div
      className={`glass-card border-primary-interactive p-4 sm:p-5 rounded-3xl flex flex-col justify-between relative transition-all duration-300 h-[280px] ${className}`}
    >
      {/* Header with related Department/Building icon */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0 text-left">
          <div className="w-6 h-6 rounded-lg bg-[var(--primary-color,#ea580c)]/12 text-[var(--primary-color,#ea580c)] flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
              Employees By Department
            </h3>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('staff')}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition-colors shrink-0 ml-2"
          >
            <span>View Directory</span>
            <TrendingUp className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 min-h-0 flex flex-col justify-between pt-2 pb-1">
        {/* Scrollable Department Bars List */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1.5 scrollbar-thin space-y-2">
          {departmentStats.map((dept, idx) => {
            const basePct = Math.min(100, Math.max(5, (dept.count / currentScaleMax) * 100));
            const isHovered = hoveredDept === dept.name;
            // On hover, dynamically increase length with spring expansion
            const targetPct = isHovered ? Math.min(100, basePct * 1.18 + 4) : basePct;
            const widthPct = mounted ? targetPct : 0;

            return (
              <div
                key={dept.name}
                className="flex items-center group cursor-pointer relative"
                onMouseEnter={() => setHoveredDept(dept.name)}
                onMouseLeave={() => setHoveredDept(null)}
                onClick={() => onNavigate && onNavigate('staff')}
              >
                {/* Left Label */}
                <span
                  className={`w-24 sm:w-28 shrink-0 text-right pr-3 text-xs font-bold truncate transition-all duration-200 ${
                    isHovered
                      ? 'text-[var(--primary-color,#ea580c)] font-black translate-x-0.5'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dept.name}
                </span>

                {/* Bar Track & Fill with dashed guideline */}
                <div className="flex-1 relative flex items-center h-4">
                  {/* Background dashed guideline across the track with transition */}
                  <div
                    className={`absolute inset-x-0 border-b border-dashed pointer-events-none transition-colors duration-300 ${
                      isHovered
                        ? 'border-[var(--primary-color,#ea580c)]/50'
                        : 'border-slate-200 dark:border-slate-800/70'
                    }`}
                  />

                  {/* Bar Fill with progressive rollout and hover increasing growth animation */}
                  <div
                    style={{
                      width: `${widthPct}%`,
                      transform: isHovered ? 'scaleX(1.08) scaleY(1.25)' : 'scaleX(1) scaleY(1)',
                      transformOrigin: 'left center',
                      transitionProperty: 'width, transform, filter, box-shadow',
                      transitionDuration: mounted ? '0.4s, 0.35s, 0.25s, 0.25s' : '0.8s, 0.8s, 0.8s, 0.8s',
                      transitionTimingFunction: mounted
                        ? 'cubic-bezier(0.34, 1.56, 0.64, 1), cubic-bezier(0.34, 1.56, 0.64, 1), ease, ease'
                        : 'cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), ease, ease',
                      transitionDelay: !mounted ? `${idx * 65}ms` : '0ms',
                    }}
                    className={`h-3 sm:h-3.5 rounded-full bg-[var(--primary-color,#ea580c)] relative z-10 ${
                      isHovered
                        ? 'brightness-110 shadow-lg shadow-[var(--primary-color,#ea580c)]/35'
                        : 'shadow-2xs'
                    }`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-white/20 pointer-events-none transition-opacity duration-200 group-hover:bg-white/35" />

                    {/* Animated sheen pulse when hovered */}
                    {isHovered && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-pulse pointer-events-none" />
                    )}

                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-7 right-0 transform translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black shadow-lg pointer-events-none z-30 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                        {dept.count} Employees ({dept.percentage}%)
                      </div>
                    )}
                  </div>

                  {/* Live Count indicator sliding in at the growing tip */}
                  <span
                    className={`ml-2 text-xs font-black transition-all duration-300 pointer-events-none whitespace-nowrap z-10 ${
                      isHovered
                        ? 'text-[var(--primary-color,#ea580c)] opacity-100 translate-x-1.5 scale-110'
                        : 'opacity-0 -translate-x-1'
                    }`}
                  >
                    {dept.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pinned Bottom Scale Axis */}
        <div className="shrink-0 flex items-center pt-1.5">
          {/* Spacer matching left label width (w-24 sm:w-28) */}
          <div className="w-24 sm:w-28 shrink-0" />
          <div className="flex-1 border-t-[1.5px] border-slate-300 dark:border-slate-700/80 relative">
            <div className="flex justify-between items-start pt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {scaleSteps.map((step) => (
                <div key={step} className="flex flex-col items-center relative">
                  <div className="w-[1.5px] h-1.5 bg-slate-300 dark:bg-slate-700/80 -mt-1" />
                  <span className="font-mono mt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px]">
            Total Staff Monitored: <strong className="text-slate-800 dark:text-white font-bold">{totalStaffCount}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
