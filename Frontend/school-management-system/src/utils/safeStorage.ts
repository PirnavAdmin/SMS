// Safe LocalStorage wrapper to prevent QuotaExceededError crashes across the entire app
export function initSafeStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;

  const originalSetItem = window.localStorage.setItem;
  const originalRemoveItem = window.localStorage.removeItem;

  const essentialKeys = new Set([
    "auth_user",
    "auth_token",
    "sms_auth_token",
    "token",
    "sidebar_collapsed",
    "academic_year",
    "selected_academic_year",
    "theme",
    "color_theme"
  ]);

  // Redundant duplicate keys that can always be cleaned up
  const redundantLegacyKeys = [
    "student_attendance",
    "sms_student_attendance",
    "leave_applications",
    "sms_leave_applications",
    "uniforms",
    "uniform_inventory",
    "uniform_categories",
    "finance_uniform_configs",
    "student_uniform_issues"
  ];

  const cleanupRedundant = () => {
    try {
      for (const k of redundantLegacyKeys) {
        if (window.localStorage.getItem(k) !== null) {
          originalRemoveItem.call(window.localStorage, k);
        }
      }
    } catch {}
  };

  // Run initial cleanup of duplicate keys
  cleanupRedundant();

  const stripHeavyData = (val: string): string => {
    try {
      // Remove large base64 data URLs if string is very large
      if (val.length > 200000 && val.includes("data:image")) {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((item: any) => {
            if (!item || typeof item !== "object") return item;
            const copy = { ...item };
            if (typeof copy.avatar === "string" && copy.avatar.startsWith("data:")) {
              copy.avatar = "";
            }
            if (typeof copy.photo === "string" && copy.photo.startsWith("data:")) {
              copy.photo = "";
            }
            if (typeof copy.documentUrl === "string" && copy.documentUrl.startsWith("data:")) {
              copy.documentUrl = "";
            }
            return copy;
          });
          return JSON.stringify(sanitized);
        }
      }
    } catch {}
    return val;
  };

  window.localStorage.setItem = function (key: string, value: string) {
    try {
      originalSetItem.call(window.localStorage, key, value);
    } catch (error: any) {
      const isQuotaError =
        error?.name === "QuotaExceededError" ||
        error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        error?.code === 22 ||
        error?.number === -2147024882;

      if (isQuotaError) {
        try {
          cleanupRedundant();

          // Collect and rank all non-essential keys by their byte size descending
          const nonEssentialKeys: { key: string; size: number }[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && !essentialKeys.has(k) && k !== key) {
              const itemLen = (window.localStorage.getItem(k) || "").length;
              nonEssentialKeys.push({ key: k, size: itemLen });
            }
          }

          // Sort largest items first
          nonEssentialKeys.sort((a, b) => b.size - a.size);

          // Evict largest non-essential cache items until space is freed
          for (const item of nonEssentialKeys) {
            try {
              originalRemoveItem.call(window.localStorage, item.key);
            } catch {}
            // Stop after evicting up to 10 large items or 2MB+
            if (item.size > 500000) break;
          }

          // Try saving again with original value
          try {
            originalSetItem.call(window.localStorage, key, value);
            return;
          } catch {}

          // If still fails, try stripped lightweight payload
          const sanitizedVal = stripHeavyData(value);
          originalSetItem.call(window.localStorage, key, sanitizedVal);
        } catch {
          // Gracefully suppress quota errors without crashing the React runtime
        }
      }
    }
  };
}

initSafeStorage();
