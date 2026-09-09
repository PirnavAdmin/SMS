/**
 * Generates a dynamic SVG avatar with user initials.
 */
export const getInitialsAvatar = (name?: string, email?: string): string => {
  let initials = '';
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    }
  } else if (email && email.trim()) {
    const local = email.split('@')[0];
    initials = local.substring(0, Math.min(2, local.length)).toUpperCase();
  }
  if (!initials) initials = 'U';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="100%" height="100%" fill="#0284c7" rx="64"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="50" font-weight="700" fill="#ffffff">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const DEFAULT_USER_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="100%" height="100%" fill="#e2e8f0" rx="64"/><path d="M64 62a22 22 0 1 0 0-44 22 22 0 0 0 0 44zm0 14c-24 0-42 15-42 32v6h84v-6c0-17-18-32-42-32z" fill="#94a3b8"/></svg>`
  );

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

  // 4. Dynamic backend uploads (e.g., /uploads/...)
  const backendBase = (import.meta.env.VITE_API_URL as string) || (import.meta.env.VITE_BACKEND_TARGET as string) || '';
  if (backendBase && trimmed.startsWith('/uploads/')) {
    const cleanBase = backendBase.trim().replace(/\/+$/, '');
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

/**
 * Resizes and crops any uploaded photo file to a standard 256x256 avatar JPEG data URL (~20KB).
 * This prevents browser localStorage quota exceeded errors, provides instant display,
 * and guarantees that the image never 404s or reverts.
 */
export const createOptimizedAvatarDataUrl = (file: File, maxSize: number = 256): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('Failed to read file.'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.width;
          const height = img.height;

          // Center-crop to square
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          canvas.width = maxSize;
          canvas.height = maxSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxSize, maxSize);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(optimizedDataUrl);
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
