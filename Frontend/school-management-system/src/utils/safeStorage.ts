// Safe LocalStorage wrapper to prevent QuotaExceededError crashes across the entire app
export function initSafeStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;

  const originalSetItem = window.localStorage.setItem;

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
        console.warn(`[SafeStorage] LocalStorage quota exceeded when saving "${key}". Cleaning non-essential cache...`);
        try {
          const essentialKeys = new Set([
            "auth_user",
            "auth_token",
            "sms_auth_token",
            "sidebar_collapsed",
            "academic_year",
            "selected_academic_year"
          ]);

          // Collect non-essential keys to free up space
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && !essentialKeys.has(k) && k !== key) {
              keysToRemove.push(k);
            }
          }

          // Remove up to 20 non-essential keys
          keysToRemove.slice(0, 20).forEach((k) => {
            try {
              window.localStorage.removeItem(k);
            } catch {}
          });

          // Try saving again
          originalSetItem.call(window.localStorage, key, value);
        } catch (retryError) {
          console.warn(`[SafeStorage] Could not persist key "${key}" due to quota limits; suppressing error.`, retryError);
        }
      } else {
        console.warn(`[SafeStorage] Failed to save key "${key}":`, error);
      }
    }
  };
}

initSafeStorage();
