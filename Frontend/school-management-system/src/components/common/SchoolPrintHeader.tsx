import React from 'react';
import { GraduationCap } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { resolveMediaUrl } from '../../utils/mediaUtils';

interface SchoolPrintHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  showAlways?: boolean; // if true, shows on screen preview as well as print
  compact?: boolean;
}

export const SchoolPrintHeader: React.FC<SchoolPrintHeaderProps> = ({
  title,
  subtitle,
  className = '',
  showAlways = false,
  compact = false
}) => {
  const { schoolProfile } = useData();

  const logoUrl = resolveMediaUrl(schoolProfile?.logoUrl);
  const schoolName = schoolProfile?.name || 'Pirnav Educational Institutions';
  const tagline = schoolProfile?.tagline || 'Empowering Minds, Shaping Tomorrow';
  const address = schoolProfile?.address || 'Jain Sadguru Images Capital Park 502B, Madhapur, Hyderabad';
  const phone = schoolProfile?.phone || '+91 9123456789';
  const email = schoolProfile?.email || 'contact@pirnavschools.edu';
  const website = schoolProfile?.website || 'https://pirnavschools.edu';
  const academicYear = schoolProfile?.academicYear || '2026-2027';

  return (
    <div className={`w-full ${compact ? 'pb-2.5 mb-3.5' : 'pb-3 mb-4'} border-b-2 border-slate-900 ${showAlways ? 'block' : 'hidden print:block'} ${className}`}>
      <div className="flex flex-row items-center justify-between gap-4">
        {/* School Logo */}
        <div className="shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={schoolName}
              className={`${compact ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-20 sm:h-20'} object-contain rounded-xl`}
            />
          ) : (
            <div className={`flex items-center justify-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-2.5'} rounded-xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 shadow-xs`}>
              <GraduationCap className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} text-sky-600 dark:text-sky-400 shrink-0`} />
              <span className={`${compact ? 'text-base' : 'text-lg'} font-black italic tracking-wider text-sky-700 dark:text-sky-400`}>
                PIRNAV <span className="text-[9px] font-bold tracking-widest uppercase block text-sky-600 text-center not-italic">SCHOOLS</span>
              </span>
            </div>
          )}
        </div>

        {/* School Profile Details */}
        <div className="text-center font-sans space-y-0.5 flex-1 pr-1">
          <h1 className={`${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-black text-slate-900 dark:text-white uppercase tracking-wider text-center leading-tight`}>
            {schoolName}
          </h1>
          {tagline && (
            <p className={`${compact ? 'text-[10.5px] sm:text-[11px]' : 'text-xs sm:text-[12.5px]'} font-bold text-sky-700 dark:text-sky-400 italic text-center`}>{tagline}</p>
          )}
          <p className={`${compact ? 'text-[9.5px] sm:text-[10px]' : 'text-[10.5px] sm:text-[11px]'} font-medium text-slate-600 dark:text-slate-300 text-center max-w-2xl mx-auto leading-tight`}>
            {address}
          </p>
          <div className={`flex items-center justify-center gap-2.5 ${compact ? 'text-[9px] sm:text-[9.5px]' : 'text-[9.5px] sm:text-[10.5px]'} font-semibold text-slate-500 dark:text-slate-400 flex-wrap text-center pt-0.5`}>
            <span>Ph: {phone}</span>
            <span>•</span>
            <span>Email: {email}</span>
            <span>•</span>
            <span>Web: {website}</span>
            <span>•</span>
            <span>Board: {schoolProfile?.boardType || 'CBSE'}</span>
            <span>•</span>
            <span>Acad. Year: {academicYear}</span>
          </div>
        </div>
      </div>

      {(title || subtitle) && (
        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          {title && <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h2>}
          {subtitle && <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};
