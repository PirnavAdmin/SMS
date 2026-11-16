import React, { useEffect } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import { validateSearchQuery } from "../../utils/validation";

interface ValidatedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onErrorChange?: (error: string | undefined) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
}

export const ValidatedSearchInput: React.FC<ValidatedSearchInputProps> = ({
  value,
  onChange,
  onErrorChange,
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

  useEffect(() => {
    if (onErrorChange) {
      onErrorChange(validation.isValid ? undefined : validation.error);
    }
  }, [validation.isValid, validation.error, onErrorChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.slice(0, maxLength));
  };

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="relative flex items-center">
        <Search
          className={`w-4 h-4 absolute left-3 pointer-events-none shrink-0 transition-colors ${
            !validation.isValid ? "text-rose-500" : "text-slate-400"
          }`}
        />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder}
          className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs outline-none transition-colors ${
            !validation.isValid
              ? "border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300"
              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/20"
          } ${inputClassName}`}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {!validation.isValid && validation.error && (
        <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate" title={validation.error}>
            {validation.error}
          </span>
        </div>
      )}
    </div>
  );
};
