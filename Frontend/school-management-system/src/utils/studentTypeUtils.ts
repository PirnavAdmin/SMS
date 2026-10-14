/**
 * Utility to standardize and format student types across the application.
 * Standard terminology: "Residential" and "Non-Residential".
 */

export const normalizeStudentType = (
  type?: string | null
): "Residential" | "Non-Residential" => {
  if (!type || typeof type !== "string") return "Non-Residential";
  const cleaned = type.trim().toLowerCase();
  if (
    cleaned.includes("non-res") ||
    cleaned.includes("non res") ||
    cleaned.includes("day scholar") ||
    cleaned.includes("dayscholar") ||
    cleaned === "non-resident" ||
    cleaned === "non resident" ||
    cleaned === "non-residential" ||
    cleaned === "regular"
  ) {
    return "Non-Residential";
  }
  if (
    cleaned.includes("res") ||
    cleaned.includes("hostel") ||
    cleaned === "resident" ||
    cleaned === "residential" ||
    cleaned === "hosteller"
  ) {
    return "Residential";
  }
  return "Non-Residential";
};

export const formatStudentType = (
  type?: string | null
): "Residential" | "Non-Residential" => {
  return normalizeStudentType(type);
};
