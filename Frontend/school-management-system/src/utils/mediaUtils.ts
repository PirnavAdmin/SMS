/**
 * Resolves media and branding URLs to ensure they work seamlessly across
 * all devices, network clients, and remote systems.
 */
export const resolveMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Data URLs or Blobs (local preview)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Absolute HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    let finalUrl = trimmed;
    if (finalUrl.includes('ngrok') && !finalUrl.includes('ngrok-skip-browser-warning')) {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${sep}ngrok-skip-browser-warning=true`;
    }
    return finalUrl;
  }

  // 3. Static public assets (e.g., /pirnav-school-logo.png)
  if (trimmed.startsWith('/pirnav-') || trimmed.startsWith('/assets/')) {
    return trimmed;
  }

  // 4. Dynamic backend uploads (e.g., /uploads/branding/...)
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // If running locally, use relative path so local Vite proxy & public/ handles it directly
  if (isLocal) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // If remote client (mobile, external laptop), resolve against backend URL
  const backendBase = (import.meta.env.VITE_API_URL as string) || (import.meta.env.VITE_BACKEND_TARGET as string) || '';
  if (backendBase) {
    const cleanBase = backendBase.replace(/\/+$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    let finalUrl = `${cleanBase}${cleanPath}`;
    if (finalUrl.includes('ngrok') && !finalUrl.includes('ngrok-skip-browser-warning')) {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${sep}ngrok-skip-browser-warning=true`;
    }
    return finalUrl;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};
