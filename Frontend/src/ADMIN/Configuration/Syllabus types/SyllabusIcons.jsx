import React from "react";

function IconBase({ children }) {
  return (
    <svg
      className="syllabus-button-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function HeadingIconBase({ children }) {
  return (
    <svg
      className="syllabus-heading-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SyllabusFormIcon() {
  return (
    <HeadingIconBase>
      <path d="M4 19.5V5a2 2 0 0 1 2-2h10.5a2.5 2.5 0 0 1 0 5H6" />
      <path d="M6 8h11" />
      <path d="M6 21h12" />
      <path d="M6 19.5A2.5 2.5 0 0 1 8.5 17H18" />
    </HeadingIconBase>
  );
}

export function SyllabusDetailsIcon() {
  return (
    <HeadingIconBase>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </HeadingIconBase>
  );
}

export function SaveIcon() {
  return (
    <IconBase>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </IconBase>
  );
}

export function ClearIcon() {
  return (
    <IconBase>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </IconBase>
  );
}

export function EditIcon() {
  return (
    <IconBase>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </IconBase>
  );
}

export function DeleteIcon() {
  return (
    <IconBase>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </IconBase>
  );
}
