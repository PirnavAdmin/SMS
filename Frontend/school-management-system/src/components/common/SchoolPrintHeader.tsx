import React from 'react';
import { GraduationCap } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { resolveMediaUrl } from '../../utils/mediaUtils';

interface SchoolPrintHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  showAlways?: boolean; // if true, shows on screen preview as well as print
}

export const SchoolPrintHeader: React.FC<SchoolPrintHeaderProps> = ({
  title,
  subtitle,
  className = '',
  showAlways = false
}) => {
  const { schoolProfile } = useData();

  const logoUrl = resolveMediaUrl(schoolProfile?.logoUrl);
  const schoolName = schoolProfile?.name || 'Pirnav Educational Institutions';
  const tagline = schoolProfile?.tagline || 'Empowering Minds, Shaping Tomorrow';
  const address = schoolProfile?.address || 'Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081';
  const phone = schoolProfile?.phone || '+91 9123456789';
  const email = schoolProfile?.email || 'contact@pirnavschools.edu';
  const website = schoolProfile?.website || 'https://pirnavschools.edu';
  const academicYear = schoolProfile?.academicYear || '2026-2027';

  return (
    <div className={`w-full pb-4 mb-6 border-b-2 border-slate-900 ${showAlways ? 'block' : 'hidden print:block'} ${className}`}>
      <div className="flex flex-row items-center justify-between gap-5">
        {/* School Logo */}
        <div className="shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={schoolName}
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-xl"
            />
          ) : (
            <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 shadow-xs">
              <GraduationCap className="w-12 h-12 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="text-2xl font-black italic tracking-wider text-sky-700 dark:text-sky-400">
                PIRNAV <span className="text-[11px] font-bold tracking-widest uppercase block text-sky-600 text-center not-italic">SCHOOLS</span>
              </span>
            </div>
          )}
        </div>

        {/* School Profile Details */}
        <div className="text-center font-sans space-y-1 flex-1 pr-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider text-center">
            {schoolName}
          </h1>
          {tagline && (
            <p className="text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-400 italic text-center">{tagline}</p>
          )}
          <p className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 text-center max-w-2xl mx-auto">
            {address}
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-wrap text-center">
            <span>Ph: {phone}</span>
            <span>•</span>
            <span>Email: {email}</span>
            <span>•</span>
            <span>Web: {website}</span>
            <span>•</span>
            <span>Acad. Year: {academicYear}</span>
          </div>
        </div>
      </div>

      {(title || subtitle) && (
        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          {title && <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h2>}
          {subtitle && <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};
