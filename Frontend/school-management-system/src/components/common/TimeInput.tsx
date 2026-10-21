import React, { useRef, useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const formatTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const mins = match[2];
  let ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm) {
    if (hours > 12) {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
    } else if (hours === 0) {
      hours = 12;
    }
  } else {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
  }
  return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
};

export const formatTo24Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const mins = match[2];
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${mins}`;
};

export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return -1;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 60 + mins;
};

export const isTimeOverlapping = (s1: string, e1: string, s2: string, e2: string): boolean => {
  const start1 = timeToMinutes(s1);
  const end1 = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2 = timeToMinutes(e2);
  if (start1 === -1 || end1 === -1 || start2 === -1 || end2 === -1) return false;
  return start1 < end2 && end1 > start2;
};

interface TimeInputProps {
  value: string; // "12:54 PM" or "12:54"
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  className = '',
  required = false,
  disabled = false,
  id,
  name,
  placeholder = 'hh:mm AM/PM',
  min,
  max
}) => {
  const timePickerRef = useRef<HTMLInputElement>(null);
  const [textValue, setTextValue] = useState(() => formatTo12Hour(value || ''));

  useEffect(() => {
    setTextValue(formatTo12Hour(value || ''));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    onChange({ target: { value: val } });
  };

  const handleTextBlur = () => {
    if (!textValue.trim()) {
      onChange({ target: { value: '' } });
      return;
    }
    const formatted = formatTo12Hour(textValue);
    setTextValue(formatted);
    onChange({ target: { value: formatted } });
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value; // HTML5 standard: "HH:MM"
    if (rawVal) {
      const formatted12 = formatTo12Hour(rawVal);
      setTextValue(formatted12);
      onChange({ target: { value: formatted12 } });
    }
  };

  const openTimePicker = () => {
    if (timePickerRef.current && !disabled) {
      if (typeof timePickerRef.current.showPicker === 'function') {
        try {
          timePickerRef.current.showPicker();
        } catch {
          timePickerRef.current.focus();
          timePickerRef.current.click();
        }
      } else {
        timePickerRef.current.focus();
        timePickerRef.current.click();
      }
    }
  };

  // Convert to 24h for native <input type="time">
  const isoTime = formatTo24Hour(textValue || value || '');
  const isValid24 = /^([01]\d|2[0-3]):[0-5]\d$/.test(isoTime);

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
        onClick={openTimePicker}
        disabled={disabled}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        title="Select Time"
      >
        <Clock className="h-4 w-4" />
      </button>

      <input
        ref={timePickerRef}
        type="time"
        tabIndex={-1}
        min={min ? formatTo24Hour(min) : undefined}
        max={max ? formatTo24Hour(max) : undefined}
        value={isValid24 ? isoTime : ''}
        onChange={handlePickerChange}
        className="sr-only opacity-0 absolute pointer-events-none"
        style={{ width: 0, height: 0, position: 'absolute', bottom: 0, right: 0 }}
      />
    </div>
  );
};

export default TimeInput;
