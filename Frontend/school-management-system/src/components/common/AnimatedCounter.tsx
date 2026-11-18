import React, { useState, useEffect, useRef } from 'react';

export interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number; // ms, default 1400
  decimals?: number; // default 0
  delay?: number; // ms, default 0
  easing?: (t: number) => number;
}

// High performance ease-out cubic function: fast start, soft gentle deceleration
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
};

// Smooth exponential ease-out
export const easeOutExpo = (t: number): number => {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

/**
 * Custom hook to smoothly animate a number from its current/start value to a target end value.
 */
export function useCountUp({
  end,
  start = 0,
  duration = 1400,
  decimals = 0,
  delay = 0,
  easing = easeOutCubic,
}: UseCountUpOptions): number {
  const [val, setVal] = useState<number>(start);
  const currentValRef = useRef<number>(start);
  const targetRef = useRef<number>(end);

  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    const initial = currentValRef.current;
    const target = end;
    targetRef.current = target;
    const delta = target - initial;

    if (delta === 0) {
      setVal(target);
      return;
    }

    let timeoutId: any = null;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / Math.max(1, duration), 1);
      const easedProgress = easing(rawProgress);
      const current = initial + delta * easedProgress;

      currentValRef.current = current;
      setVal(current);

      if (rawProgress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        currentValRef.current = target;
        setVal(target);
      }
    };

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        animId = requestAnimationFrame(tick);
      }, delay);
    } else {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      cancelAnimationFrame(animId);
    };
  }, [end, duration, delay, easing]);

  return val;
}

/**
 * Custom hook to get a smooth eased 0 -> 1 progress value for SVG arcs, bars, and gauges.
 */
export function useEaseProgress(
  duration: number = 1400,
  delay: number = 0,
  triggerKey?: any
): number {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    let timeoutId: any = null;
    setProgress(0);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const p = Math.min(elapsed / Math.max(1, duration), 1);
      const eased = easeOutCubic(p);
      setProgress(eased);

      if (p < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setProgress(1);
      }
    };

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        animId = requestAnimationFrame(step);
      }, delay);
    } else {
      animId = requestAnimationFrame(step);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      cancelAnimationFrame(animId);
    };
  }, [duration, delay, triggerKey]);

  return progress;
}

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  padZero?: boolean;
  formatter?: (n: number) => string;
  className?: string;
  delay?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  padZero = false,
  formatter,
  className = '',
  delay = 0,
}) => {
  const liveVal = useCountUp({ end: value, duration, decimals, delay });

  let text = '';
  if (formatter) {
    text = formatter(liveVal);
  } else if (padZero) {
    const rounded = Math.round(liveVal);
    text = rounded < 10 && rounded >= 0 ? `0${rounded}` : `${rounded}`;
  } else if (decimals > 0) {
    text = liveVal.toFixed(decimals);
  } else {
    text = Math.round(liveVal).toLocaleString();
  }

  return (
    <span className={`tabular-nums inline-block ${className}`}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
