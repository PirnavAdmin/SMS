import React, { useState } from 'react';
import { Calendar, Users, Briefcase } from 'lucide-react';

export interface AttendanceStatusItem {
  key: 'present' | 'absent' | 'late' | 'halfDay';
  label: string;
  count: number;
  pct: number;
  color: string;
  darkColor: string;
}

export interface AbsenteeProfile {
  name: string;
  avatar?: string;
  roleOrClass?: string;
}

interface SpeedometerAttendanceCardProps {
  title: string;
  subtitle?: string;
  iconType?: 'students' | 'staff';
  headerRight?: React.ReactNode;
  stats: {
    present: number;
    absent: number;
    late: number;
    halfDay?: number;
    permission?: number;
    total: number;
    presentPct: number;
    latePct: number;
    halfDayPct?: number;
    absentPct: number;
  };
  absenteeList?: AbsenteeProfile[];
  onViewDetails?: () => void;
  className?: string;
}

function describeArc(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startAngle: number,
  endAngle: number
): string {
  const rad1 = (startAngle * Math.PI) / 180;
  const rad2 = (endAngle * Math.PI) / 180;

  const x1_out = cx + rOut * Math.cos(rad1);
  const y1_out = cy - rOut * Math.sin(rad1);
  const x2_out = cx + rOut * Math.cos(rad2);
  const y2_out = cy - rOut * Math.sin(rad2);

  const x1_in = cx + rIn * Math.cos(rad1);
  const y1_in = cy - rIn * Math.sin(rad1);
  const x2_in = cx + rIn * Math.cos(rad2);
  const y2_in = cy - rIn * Math.sin(rad2);

  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;

  return [
    `M ${x1_out.toFixed(2)} ${y1_out.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2_out.toFixed(2)} ${y2_out.toFixed(2)}`,
    `L ${x2_in.toFixed(2)} ${y2_in.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1_in.toFixed(2)} ${y1_in.toFixed(2)}`,
    'Z'
  ].join(' ');
}

export const SpeedometerAttendanceCard: React.FC<SpeedometerAttendanceCardProps> = ({
  title,
  subtitle,
  iconType = 'students',
  headerRight,
  stats,
  absenteeList = [],
  onViewDetails,
  className = ''
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const total = stats.total || 0;
  const present = stats.present || 0;
  const absent = stats.absent || 0;
  const late = stats.late || 0;
  const halfDay = (stats.halfDay ?? stats.permission) || 0;

  // Percentage calculations
  const presentPct = total > 0 ? stats.presentPct ?? Math.round((present / total) * 100) : 0;
  const absentPct = total > 0 ? stats.absentPct ?? Math.round((absent / total) * 100) : 0;
  const latePct = total > 0 ? stats.latePct ?? Math.round((late / total) * 100) : 0;
  const halfDayPct = total > 0 ? stats.halfDayPct ?? Math.max(0, 100 - presentPct - absentPct - latePct) : 0;

  // Status configuration - Order: Present, Absent, Late, Half Day
  const statusItems: AttendanceStatusItem[] = [
    {
      key: 'present',
      label: 'Present',
      count: present,
      pct: presentPct,
      color: '#00c853',
      darkColor: '#10b981'
    },
    {
      key: 'absent',
      label: 'Absent',
      count: absent,
      pct: absentPct,
      color: '#e53935',
      darkColor: '#ef4444'
    },
    {
      key: 'late',
      label: 'Late',
      count: late,
      pct: latePct,
      color: '#083344',
      darkColor: '#14b8a6'
    },
    {
      key: 'halfDay',
      label: 'Half Day',
      count: halfDay,
      pct: halfDayPct,
      color: '#fbbf24',
      darkColor: '#f59e0b'
    }
  ];

  // SVG Arch Geometry
  const cx = 100;
  const cy = 96;
  const rIn = 55;
  const rOut = 83;

  // Gauge order from left (180 deg) to right (0 deg):
  // 1. Present (starts first from bottom-left 180 deg)
  // 2. Late
  // 3. Half Day
  // 4. Absent (finishes at right 0 deg)
  const gaugeSegmentsOrder: AttendanceStatusItem[] = [
    statusItems.find(s => s.key === 'present')!,
    statusItems.find(s => s.key === 'late')!,
    statusItems.find(s => s.key === 'halfDay')!,
    statusItems.find(s => s.key === 'absent')!
  ].filter(Boolean);

  // Compute segment angular spans
  const activeGaugeSegments = gaugeSegmentsOrder.filter(s => s.count > 0);
  const totalActiveCount = activeGaugeSegments.reduce((sum, s) => sum + s.count, 0);

  const gapDeg = activeGaugeSegments.length > 1 ? 3 : 0;
  const totalGaps = (activeGaugeSegments.length - 1) * gapDeg;
  const availableDeg = 180 - totalGaps;

  let currentAngle = 180;
  const renderedSegments = activeGaugeSegments.map((item) => {
    // Ensure small values (e.g. 1% or 2%) have a visible min angle of 5 deg
    const rawAngle = totalActiveCount > 0 ? (item.count / totalActiveCount) * availableDeg : 0;
    const clampedAngle = Math.max(5, rawAngle);
    return {
      ...item,
      desiredAngle: clampedAngle
    };
  });

  // Re-scale if clamped sum exceeds availableDeg
  const sumAngles = renderedSegments.reduce((s, it) => s + it.desiredAngle, 0);
  const finalSegments = renderedSegments.map(item => {
    const finalAngle = sumAngles > 0 ? (item.desiredAngle / sumAngles) * availableDeg : 0;
    const start = currentAngle;
    const end = currentAngle - finalAngle;
    currentAngle = end - gapDeg;
    return {
      ...item,
      startAngle: start,
      endAngle: end,
      path: describeArc(cx, cy, rIn, rOut, start, end)
    };
  });

  // Active hover data
  const hoveredItem = statusItems.find(s => s.key === hoveredKey);

  return (
    <div
      onClick={onViewDetails}
      className={`glass-card border-primary-interactive p-5 rounded-3xl cursor-pointer flex flex-col justify-between active:scale-[0.99] transition-all duration-300 relative group/card select-none ${className}`}
    >
      {/* 1. Header */}
      <div className="shrink-0 space-y-1.5 text-left">
        {/* Top row: Icon + Full Title + Today badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-xs transition-transform duration-300 group-hover/card:scale-105 ${
                iconType === 'students'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
              }`}
            >
              {iconType === 'students' ? (
                <Users className="w-4 h-4 stroke-[2.3]" />
              ) : (
                <Briefcase className="w-4 h-4 stroke-[2.3]" />
              )}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight whitespace-nowrap">
              {title}
            </h3>
          </div>

          {/* Today Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Today</span>
          </div>
        </div>

        {/* Subtitle row with optional segmented toggle - fixed height h-7 for identical alignment */}
        <div className="flex items-center justify-between gap-2 h-7">
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {subtitle}
          </p>
          {headerRight && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          )}
        </div>
      </div>

      {/* 2. Speedometer Arch Gauge */}
      <div className="relative flex items-center justify-center w-full my-auto py-1">
        <div className="relative w-full max-w-[215px] aspect-[200/105]">
          <svg
            viewBox="0 0 200 108"
            className="w-full h-full overflow-visible drop-shadow-xs"
          >
            {/* Background track arch */}
            <path
              d={describeArc(cx, cy, rIn, rOut, 180, 0)}
              className="fill-slate-100 dark:fill-slate-800/60 transition-colors"
            />

            {/* Dynamic Colored Arch Segments */}
            {finalSegments.map((seg) => {
              const isHovered = hoveredKey === seg.key;
              return (
                <path
                  key={seg.key}
                  d={seg.path}
                  fill={seg.color}
                  stroke="rgba(255,255,255,0.85)"
                  className="dark:stroke-slate-900 transition-all duration-200 cursor-pointer"
                  style={{
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    filter: isHovered ? 'brightness(1.1) drop-shadow(0 2px 6px rgba(0,0,0,0.2))' : 'none'
                  }}
                  onMouseEnter={() => setHoveredKey(seg.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              );
            })}
          </svg>

          {/* Center cutout content */}
          <div className="absolute inset-x-0 bottom-2.5 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight transition-colors">
              {hoveredItem ? `${hoveredItem.label} Count` : 'Total Attendance'}
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mt-0.5">
              {hoveredItem ? (
                <>
                  {hoveredItem.count}
                  <span className="text-xs font-bold text-slate-400 ml-1">
                    ({hoveredItem.pct}%)
                  </span>
                </>
              ) : (
                total
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Status Breakdown List */}
      <div className="space-y-1.5 text-left px-0.5 pb-1">
        <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          Status
        </h4>
        <div className="space-y-1">
          {statusItems.map((item) => {
            const isHovered = hoveredKey === item.key;
            return (
              <div
                key={item.key}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between text-xs py-0.5 px-1.5 rounded-lg transition-colors cursor-pointer ${
                  isHovered
                    ? 'bg-slate-100/80 dark:bg-slate-800/80 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform duration-200"
                    style={{
                      backgroundColor: item.color,
                      transform: isHovered ? 'scale(1.25)' : 'scale(1)'
                    }}
                  />
                  <span
                    className={`font-semibold ${
                      isHovered
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 min-w-[36px] text-right">
                    {item.pct}%
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 min-w-[24px] text-right">
                    ({item.count})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpeedometerAttendanceCard;
