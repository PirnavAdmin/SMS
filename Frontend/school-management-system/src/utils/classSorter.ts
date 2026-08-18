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
