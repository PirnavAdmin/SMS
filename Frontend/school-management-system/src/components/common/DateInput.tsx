import React, { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { formatToDDMMYYYY, formatToISO } from '../../utils/dateValidation';

interface DateInputProps {
  value: string; // ISO (YYYY-MM-DD) or DD-MM-YYYY
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className = '',
  required = false,
  disabled = false,
  id,
  name,
  placeholder = 'DD-MM-YYYY'
}) => {
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Maintain text state in DD-MM-YYYY format
  const [textValue, setTextValue] = useState(() => formatToDDMMYYYY(value, '-'));

  // Sync internal textValue when external value prop changes
  useEffect(() => {
    setTextValue(formatToDDMMYYYY(value, '-'));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);

    // If matches DD-MM-YYYY or DD/MM/YYYY format or YYYY-MM-DD
    const iso = formatToISO(val);
    if (iso && iso.match(/^\d{4}-\d{2}-\d{2}$/)) {
      onChange({ target: { value: iso } });
    }
  };

  const handleTextBlur = () => {
    const iso = formatToISO(textValue);
    if (iso && iso.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setTextValue(formatToDDMMYYYY(iso, '-'));
      onChange({ target: { value: iso } });
    } else if (!textValue) {
      onChange({ target: { value: '' } });
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (iso) {
      setTextValue(formatToDDMMYYYY(iso, '-'));
      onChange({ target: { value: iso } });
    }
  };

  const openCalendar = () => {
    if (datePickerRef.current && !disabled) {
      if (typeof datePickerRef.current.showPicker === 'function') {
        try {
          datePickerRef.current.showPicker();
        } catch {
          datePickerRef.current.focus();
          datePickerRef.current.click();
        }
      } else {
        datePickerRef.current.focus();
        datePickerRef.current.click();
      }
    }
  };

  const isoValue = formatToISO(value) || '';

  return (
    <div className="relative inline-flex items-center w-full">
      <input
        type="text"
        id={id}
        name={name}
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`${className} pr-9`}
      />

      <button
        type="button"
        onClick={openCalendar}
        disabled={disabled}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        title="Open Calendar"
      >
        <Calendar className="h-4 w-4" />
      </button>

      <input
        ref={datePickerRef}
        type="date"
        tabIndex={-1}
        value={isoValue.match(/^\d{4}-\d{2}-\d{2}$/) ? isoValue : ''}
        onChange={handlePickerChange}
        className="sr-only opacity-0 absolute pointer-events-none"
        style={{ width: 0, height: 0, position: 'absolute', bottom: 0, right: 0 }}
      />
    </div>
  );
};

export default DateInput;
