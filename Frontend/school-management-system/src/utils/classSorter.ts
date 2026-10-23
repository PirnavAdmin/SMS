/**
 * Purely Dynamic Class Grade Sorter & Range Validator
 * Loads class sequence dynamically from database records (zero hardcoded static class names).
 */

export const normalizeClassName = (name?: string | null): string => {
  if (!name) return "";
  const lower = name.trim().toLowerCase();

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
export const matchesClassName = (classA?: string | null, classB?: string | null): boolean => {
  if (!classA || !classB) return false;
  if (classA.trim().toLowerCase() === classB.trim().toLowerCase()) return true;
  const normA = normalizeClassName(classA);
  const normB = normalizeClassName(classB);
  if (!normA || !normB) return false;
  return normA === normB;
};

/**
 * Returns a numerical sort order for class grade names (ascending order).
 * Prioritizes dynamic displayOrder from the database `classes` table if available.
 */
export const getSortOrderForClass = (
  className?: string,
  dynamicClassesList?: Array<{ name?: string; className?: string; displayOrder?: number; id?: any }>
): number => {
  if (!className) return 999;
  const trimmed = className.trim();

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
 * Comparator function to sort two class grade names in natural ascending order.
 */
export const compareClassesAscending = (
  classA?: string,
  classB?: string,
  dynamicClassesList?: any[]
): number => {
  const nameA = classA || '';
  const nameB = classB || '';
  const orderA = getSortOrderForClass(nameA, dynamicClassesList);
  const orderB = getSortOrderForClass(nameB, dynamicClassesList);
  if (orderA !== orderB) return orderA - orderB;
  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Formats a class name for clean UI display.
 */
export const formatDisplayClassName = (name?: string | null): string => {
  if (!name) return "";
  return name.trim();
};

/**
 * Checks whether a given class falls within a configured class range (inclusive).
 * If startClass or endClass is empty or "All", returns true.
 */
export const isClassInRange = (
  className?: string | null,
  startClass?: string | null,
  endClass?: string | null,
  classRange?: string | null,
  dynamicClassesList?: any[]
): boolean => {
  if (!className) return false;
  if (!startClass && !endClass && (!classRange || classRange === "All Classes" || classRange === "All")) {
    return true;
  }

  // If classRange is provided in format "Class 1 - Class 4" or "Class 1 to Class 4"
  if (!startClass && !endClass && classRange) {
    const parts = classRange.split(/[-–—to]/i).map(p => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      startClass = parts[0];
      endClass = parts[1];
    } else if (parts.length === 1) {
      startClass = parts[0];
      endClass = parts[0];
    }
  }

  const orderClass = getSortOrderForClass(className, dynamicClassesList);
  const orderStart = startClass ? getSortOrderForClass(startClass, dynamicClassesList) : 0;
  const orderEnd = endClass ? getSortOrderForClass(endClass, dynamicClassesList) : 999;

  const minOrder = Math.min(orderStart, orderEnd);
  const maxOrder = Math.max(orderStart, orderEnd);

  return orderClass >= minOrder && orderClass <= maxOrder;
};

/**
 * Checks whether two class ranges overlap.
 */
export const doClassRangesOverlap = (
  startA?: string | null,
  endA?: string | null,
  startB?: string | null,
  endB?: string | null,
  dynamicClassesList?: any[]
): boolean => {
  if (!startA || !endA || !startB || !endB) return true;
  const aMin = Math.min(getSortOrderForClass(startA, dynamicClassesList), getSortOrderForClass(endA, dynamicClassesList));
  const aMax = Math.max(getSortOrderForClass(startA, dynamicClassesList), getSortOrderForClass(endA, dynamicClassesList));
  const bMin = Math.min(getSortOrderForClass(startB, dynamicClassesList), getSortOrderForClass(endB, dynamicClassesList));
  const bMax = Math.max(getSortOrderForClass(startB, dynamicClassesList), getSortOrderForClass(endB, dynamicClassesList));

  return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
};
