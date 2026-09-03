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
    return trimmed;
  }

  // 3. Static public assets (e.g., /pirnav-school-logo.png)
  if (trimmed.startsWith('/pirnav-') || trimmed.startsWith('/assets/')) {
    return trimmed;
  }

  // 4. Dynamic backend uploads (e.g., /uploads/branding/...)
  const backendBase = (import.meta.env.VITE_API_URL as string) || (import.meta.env.VITE_BACKEND_TARGET as string) || '';
  if (backendBase) {
    const cleanBase = backendBase.replace(/\/+$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${cleanBase}${cleanPath}`;
  }

  return trimmed;
};
