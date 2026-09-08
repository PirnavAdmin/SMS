/**
 * Resolves media and branding URLs to ensure they work seamlessly across
 * all devices, network clients, and remote systems.
 */
export const DEFAULT_USER_AVATAR =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';

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
