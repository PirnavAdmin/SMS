import React from 'react';
import { useData } from '../../context/DataContext';

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

  const logoUrl = schoolProfile?.logoUrl || '';
  const schoolName = schoolProfile?.name || 'Pirnav Educational Institutions';
  const tagline = schoolProfile?.tagline || 'Empowering Minds, Shaping Tomorrow';
  const address = schoolProfile?.address || 'Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081';
  const phone = schoolProfile?.phone || '+91 9123456789';
  const email = schoolProfile?.email || 'contact@pirnavschools.edu';
  const website = schoolProfile?.website || 'https://pirnavschools.edu';
  const academicYear = schoolProfile?.academicYear || '2026-2027';

  return (
    <div className={`w-full pb-4 mb-6 border-b-2 border-slate-900 ${showAlways ? 'block' : 'hidden print:block'} ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* School Logo */}
        <div className="shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={schoolName}
              className="w-20 h-20 object-contain rounded-xl"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white font-black text-2xl flex items-center justify-center border-2 border-sky-700 shadow-xs">
              {schoolName.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* School Profile Details */}
        <div className="flex-1 text-center font-sans space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wide">
            {schoolName}
          </h1>
          {tagline && (
            <p className="text-xs font-bold text-sky-700 dark:text-sky-400 italic">{tagline}</p>
          )}
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
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

        {/* Right Badge */}
        <div className="shrink-0 text-right hidden sm:block">
          <div className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center">
            Official<br />Document
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
