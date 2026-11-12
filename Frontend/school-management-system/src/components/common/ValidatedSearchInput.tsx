import React from "react";
import { Search, X } from "lucide-react";
import { validateSearchQuery } from "../../utils/validation";

interface ValidatedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
}

export const ValidatedSearchInput: React.FC<ValidatedSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  maxLength = 30,
  className = "w-full",
  inputClassName = "",
  ariaLabel,
}) => {
  const validation = React.useMemo(
    () => validateSearchQuery(value, maxLength),
    [value, maxLength]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.slice(0, maxLength));
  };

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none shrink-0" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder}
          className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs outline-none transition-colors ${
            !validation.isValid
              ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300"
              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-400"
          } ${inputClassName}`}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {!validation.isValid && validation.error && (
        <p className="text-[11px] font-medium text-rose-500 mt-1 truncate" title={validation.error}>
          {validation.error}
        </p>
      )}
    </div>
  );
};
