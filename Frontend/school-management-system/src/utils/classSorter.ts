/**
 * Purely Dynamic Class Grade Sorter & Range Validator
 * Loads class sequence dynamically from database records (zero hardcoded static class names).
 */

export const extractClassName = (val: any): string => {
  if (!val && val !== 0) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val).trim();
  if (typeof val === "object") {
    const raw = val.name || val.className || val.displayName || "";
    return typeof raw === "string" ? raw.trim() : String(raw || "").trim();
  }
  return String(val).trim();
};

export const normalizeClassName = (name?: any): string => {
  const str = extractClassName(name);
  if (!str) return "";
  const lower = str.toLowerCase();

  // Explicit grade number (e.g. "Class 1 - A" -> "1", "Class 10 - A" -> "10", "1st" -> "1", "10th" -> "10")
  const match = lower.match(/^(?:class|grade|std|standard)?\s*(\d+)(?:st|nd|rd|th)?(?:[-\s]+[a-z0-9]+)?$/i);
  if (match) {
    return match[1];
  }

  let clean = lower.replace(/^(class|grade|std|standard)\s+/i, "");
  clean = clean.replace(/[-\s]+[a-z]$/i, ""); // remove trailing section like "- A" or " A"
  clean = clean.replace(/(st|nd|rd|th)$/i, ""); // remove ordinals
  return clean.trim();
};

/**
 * Checks if two class names refer to the same grade.
 * Strictly uses exact normalized equality to prevent substring collisions (e.g. Class 1 matching Class 10).
 */
export const matchesClassName = (classA?: any, classB?: any): boolean => {
  const strA = extractClassName(classA);
  const strB = extractClassName(classB);
  if (!strA || !strB) return false;
  if (strA.toLowerCase() === strB.toLowerCase()) return true;
  const normA = normalizeClassName(strA);
  const normB = normalizeClassName(strB);
  if (!normA || !normB) return false;
  return normA === normB;
};

/**
 * Returns a numerical sort order for class grade names (ascending order).
 * Prioritizes dynamic displayOrder from the database `classes` table if available.
 */
export const getSortOrderForClass = (
  className?: any,
  dynamicClassesList?: Array<{ name?: string; className?: string; displayOrder?: number; id?: any }>
): number => {
  if (className && typeof className === "object" && typeof className.displayOrder === "number") {
    return className.displayOrder;
  }
  const trimmed = extractClassName(className);
  if (!trimmed) return 999;

  // 1. Dynamic class matching from database list (Zero hardcoded names)
  if (dynamicClassesList && Array.isArray(dynamicClassesList) && dynamicClassesList.length > 0) {
    const idx = dynamicClassesList.findIndex((c) => {
      const cName = c.name || c.className || "";
      return matchesClassName(cName, trimmed);
    });
    if (idx !== -1) {
      const dOrder = dynamicClassesList[idx].displayOrder;
      return typeof dOrder === "number" ? dOrder : idx + 1;
    }
  }

  // 2. Fallback: Numeric grade extraction (e.g. "Class 5" -> 105)
  const match = trimmed.match(/(\d+)/);
  if (match) {
    return 100 + parseInt(match[1], 10);
  }

  return 999;
};

/**
 * Comparator function to sort two class grade names or AcademicClass objects in natural ascending order.
 */
export const compareClassesAscending = (
  classA?: any,
  classB?: any,
  dynamicClassesList?: any[]
): number => {
  const nameA = extractClassName(classA);
  const nameB = extractClassName(classB);
  const orderA = getSortOrderForClass(classA, dynamicClassesList);
  const orderB = getSortOrderForClass(classB, dynamicClassesList);
  if (orderA !== orderB) return orderA - orderB;
  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Formats a class name for clean UI display.
 */
export const formatDisplayClassName = (name?: any): string => {
  return extractClassName(name);
};

/**
 * Checks whether a given class falls within a configured class range (inclusive).
 * If startClass or endClass is empty or "All", returns true.
 */
export const isClassInRange = (
  className?: any,
  startClass?: any,
  endClass?: any,
  classRange?: any,
  dynamicClassesList?: any[]
): boolean => {
  const strClass = extractClassName(className);
  if (!strClass) return false;
  const strStart = extractClassName(startClass);
  const strEnd = extractClassName(endClass);
  const strRange = extractClassName(classRange);

  if (!strStart && !strEnd && (!strRange || strRange === "All Classes" || strRange === "All")) {
    return true;
  }

  let finalStart = strStart;
  let finalEnd = strEnd;

  // If classRange is provided in format "Class 1 - Class 4" or "Class 1 to Class 4"
  if (!finalStart && !finalEnd && strRange) {
    const parts = strRange.split(/[-–—to]/i).map(p => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      finalStart = parts[0];
      finalEnd = parts[1];
    } else if (parts.length === 1) {
      finalStart = parts[0];
      finalEnd = parts[0];
    }
  }

  const orderClass = getSortOrderForClass(strClass, dynamicClassesList);
  const orderStart = finalStart ? getSortOrderForClass(finalStart, dynamicClassesList) : 0;
  const orderEnd = finalEnd ? getSortOrderForClass(finalEnd, dynamicClassesList) : 999;

  const minOrder = Math.min(orderStart, orderEnd);
  const maxOrder = Math.max(orderStart, orderEnd);

  return orderClass >= minOrder && orderClass <= maxOrder;
};

/**
 * Checks whether two class ranges overlap.
 */
export const doClassRangesOverlap = (
  startA?: any,
  endA?: any,
  startB?: any,
  endB?: any,
  dynamicClassesList?: any[]
): boolean => {
  if (!startA || !endA || !startB || !endB) return true;
  const aMin = Math.min(getSortOrderForClass(startA, dynamicClassesList), getSortOrderForClass(endA, dynamicClassesList));
  const aMax = Math.max(getSortOrderForClass(startA, dynamicClassesList), getSortOrderForClass(endA, dynamicClassesList));
  const bMin = Math.min(getSortOrderForClass(startB, dynamicClassesList), getSortOrderForClass(endB, dynamicClassesList));
  const bMax = Math.max(getSortOrderForClass(startB, dynamicClassesList), getSortOrderForClass(endB, dynamicClassesList));

  return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
};
