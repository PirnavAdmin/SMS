import React from "react";

export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  text?: string | boolean;
  className?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text = "Loading...",
  className = "",
  fullPage = false,
}) => {
  const sizeMap = {
    xs: { dim: "w-4 h-4", border: "border-2", font: "text-[11px]" },
    sm: { dim: "w-6 h-6", border: "border-2", font: "text-xs" },
    md: { dim: "w-8 h-8", border: "border-[2.5px]", font: "text-xs" },
    lg: { dim: "w-11 h-11", border: "border-3", font: "text-sm" },
    xl: { dim: "w-14 h-14", border: "border-[3.5px]", font: "text-base" },
  };

  const { dim, border, font } = sizeMap[size] || sizeMap.md;

  // Ensure message is strictly simple "Loading..." without long extended sentences
  const displayText = text === false || text === "" ? null : "Loading...";

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-2.5 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`relative ${dim} flex items-center justify-center shrink-0`}>
        {/* Subtle background track */}
        <div
          className={`absolute inset-0 rounded-full ${border}`}
          style={{
            borderColor: "color-mix(in srgb, var(--secondary-color, #f59e0b) 20%, transparent)",
          }}
        />
        {/* Animated active spinning arc in secondary color */}
        <div
          className={`absolute inset-0 rounded-full ${border} border-transparent animate-spin`}
          style={{
            borderTopColor: "var(--secondary-color, #f59e0b)",
            borderRightColor: "var(--secondary-color, #f59e0b)",
          }}
        />
        {/* Inner subtle glow pulse */}
        <div
          className="w-1.5 h-1.5 rounded-full animate-ping opacity-75"
          style={{
            backgroundColor: "var(--secondary-color, #f59e0b)",
          }}
        />
      </div>

      {displayText && (
        <span
          className={`${font} font-medium tracking-wide text-slate-500 dark:text-slate-400 select-none animate-pulse`}
        >
          {displayText}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[200px] w-full flex items-center justify-center p-6 animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
