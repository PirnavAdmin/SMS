/**
 * Returns a numerical sort order for class grade names (ascending order).
 * Pre-school grades (Playgroup, Nursery, LKG, UKG, Prep) come first (1..5),
 * followed by numeric grades (Class 1..12) in exact natural numeric order.
 */
export const getSortOrderForClass = (className?: string): number => {
  if (!className) return 999;
  const lower = className.trim().toLowerCase();

  if (lower.includes('playgroup') || lower.includes('play group') || lower.includes('pg')) return 1;
  if (lower.includes('nursery') || lower.includes('nurs')) return 2;
  if (lower.includes('lkg') || lower.includes('l.k.g')) return 3;
  if (lower.includes('ukg') || lower.includes('u.k.g')) return 4;
  if (lower.includes('prep') || lower.includes('kg')) return 5;

  const match = lower.match(/(\d+)/);
  if (match) {
    return 10 + parseInt(match[1], 10);
  }

  return 100;
};

/**
 * Comparator function to sort two class grade names in natural ascending order.
 */
export const compareClassesAscending = (classA?: string, classB?: string): number => {
  const nameA = classA || '';
  const nameB = classB || '';
  const orderA = getSortOrderForClass(nameA);
  const orderB = getSortOrderForClass(nameB);
  if (orderA !== orderB) return orderA - orderB;
  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
};

export const normalizeClassName = (name?: string | null): string => {
  if (!name) return "";
  const lower = name.trim().toLowerCase();

  // Preschool canonical tokens
  if (lower.includes('playgroup') || lower.includes('play group') || lower.includes('pg')) return 'playgroup';
  if (lower.includes('nursery') || lower.includes('nurs')) return 'nursery';
  if (lower.includes('lkg') || lower.includes('l.k.g')) return 'lkg';
  if (lower.includes('ukg') || lower.includes('u.k.g')) return 'ukg';
  if (lower.includes('prep')) return 'prep';

  // Explicit grade number (e.g. "Class 1 - A" -> "1", "Class 10 - A" -> "10", "1st" -> "1", "10th" -> "10")
  const match = lower.match(/(?:class|grade)?\s*(\d+)/i);
  if (match) {
    return match[1];
  }

  let clean = lower.replace(/^class\s+/i, "");
  clean = clean.replace(/[-\s][a-z]$/i, ""); // remove trailing section like "- A" or " A"
  clean = clean.replace(/(st|nd|rd|th)$/i, ""); // remove ordinals
  return clean.trim();
};

/**
 * Checks if two class names refer to the same grade.
 * Strictly uses exact normalized equality to prevent substring collisions (e.g. Class 1 matching Class 10).
 */
export const matchesClassName = (classA?: string | null, classB?: string | null): boolean => {
  const normA = normalizeClassName(classA);
  const normB = normalizeClassName(classB);
  if (!normA || !normB) return false;
  return normA === normB;
};

/**
 * Formats a class name for clean UI display.
 * Pre-school grades (Nursery, LKG, UKG, Playgroup, Prep) omit the "Class " prefix.
 * Standard numerical grades (1 to 12) include the "Class " prefix (e.g. "Class 1").
 */
export const formatDisplayClassName = (name?: string | null): string => {
  if (!name) return "";
  const clean = name.trim();
  const withoutPrefix = clean.replace(/^class\s+/i, "").trim();
  const lowerWithoutPrefix = withoutPrefix.toLowerCase();

  if (lowerWithoutPrefix === 'nursery' || lowerWithoutPrefix === 'nurs') return 'Nursery';
  if (lowerWithoutPrefix === 'lkg' || lowerWithoutPrefix === 'l.k.g') return 'LKG';
  if (lowerWithoutPrefix === 'ukg' || lowerWithoutPrefix === 'u.k.g') return 'UKG';
  if (lowerWithoutPrefix === 'playgroup' || lowerWithoutPrefix === 'play group' || lowerWithoutPrefix === 'pg') return 'Playgroup';
  if (lowerWithoutPrefix === 'prep') return 'Prep';

  if (/^\d+/.test(withoutPrefix)) {
    return `Class ${withoutPrefix}`;
  }

  if (clean.toLowerCase().startsWith('class ')) {
    return `Class ${withoutPrefix}`;
  }

  return `Class ${withoutPrefix}`;
};

