import { resolveMediaUrl } from './mediaUtils';

/**
 * Dynamically applies and synchronizes school branding across:
 * - Browser tab title (`document.title`)
 * - Browser favicon (`<link rel="icon">`)
 * - Persistent storage cache (to prevent hydration glitch on refresh)
 * - Custom DOM event for instant reactive component updates
 */
export const applySchoolBranding = (schoolName?: string, logoUrl?: string) => {
  if (typeof document === 'undefined') return;

  const effectiveName = (schoolName || '').trim();

  // 1. Update Document Title
  if (effectiveName) {
    document.title = `${effectiveName} | SMS Portal`;
    try {
      localStorage.setItem('school_name', effectiveName);
    } catch {}
  }

  // 2. Update Browser Favicon if logo is present
  if (logoUrl !== undefined) {
    try {
      const cleanLogo = (logoUrl || '').trim();
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0]?.appendChild(link);
      }
      if (cleanLogo) {
        link.href = resolveMediaUrl(cleanLogo);
        localStorage.setItem('tenant_school_logo', cleanLogo);
        localStorage.setItem('school_logo', cleanLogo);
      } else {
        // Empty icon or generic SVG
        link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏫</text></svg>';
        localStorage.removeItem('tenant_school_logo');
        localStorage.removeItem('school_logo');
      }
    } catch {}
  }
};
