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
      <div className="flex flex-col items-center justify-center text-center gap-2">
        {/* School Logo */}
        <div className="shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={schoolName}
              className="w-16 h-16 object-contain rounded-xl mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-2xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 shadow-xs mx-auto">
              <GraduationCap className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              <span className="text-xl font-black italic tracking-wider text-sky-700 dark:text-sky-400">
                PIRNAV <span className="text-[9px] font-bold tracking-widest uppercase block text-sky-600 text-center not-italic">SCHOOLS</span>
              </span>
            </div>
          )}
        </div>

        {/* School Profile Details */}
        <div className="text-center font-sans space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wide text-center">
            {schoolName}
          </h1>
          {tagline && (
            <p className="text-xs font-bold text-sky-700 dark:text-sky-400 italic text-center">{tagline}</p>
          )}
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 text-center">
            {address}
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-wrap">
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
