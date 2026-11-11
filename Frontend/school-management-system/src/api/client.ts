let activeBranchHeader = '';
let activeAcademicYearHeader = '';

export const setActiveBranchHeader = (b: string) => {
  activeBranchHeader = b || '';
};

export const setActiveAcademicYearHeader = (ay: string) => {
  activeAcademicYearHeader = ay || '';
};

// Set of active abort controllers for pending requests
const activeAbortControllers = new Set<AbortController>();

/**
 * Cancels all currently in-flight requests (e.g., during logout or session expiration).
 */
export const cancelPendingRequests = () => {
  for (const controller of activeAbortControllers) {
    try {
      controller.abort();
    } catch {}
  }
  activeAbortControllers.clear();
};

if (typeof window !== 'undefined') {
  window.addEventListener('auth_logout', cancelPendingRequests);
}

let isHandlingSessionExpiry = false;

export const apiClient = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('auth_token');
  const branch = activeBranchHeader;
  const academicYear = activeAcademicYearHeader;

  let userRole = '';
  try {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser && parsedUser.role) {
        userRole = parsedUser.role;
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }

  const isAuthEndpoint = endpoint.includes('/auth/') || endpoint.includes('/superadmin/login');

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('ngrok-skip-browser-warning', 'true');
  if (userRole) {
    headers.set('X-User-Role', userRole);
  }
  if (!isAuthEndpoint && token && token !== 'null' && token !== 'undefined' && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (branch && branch !== 'All Branches' && branch !== 'All') {
    headers.set('X-Branch-Id', branch);
  }
  if (academicYear && academicYear !== 'All') {
    headers.set('X-Academic-Year-Id', academicYear);
  }

  const rawBase = (import.meta.env.VITE_API_URL as string) || '';
  const baseUrl = rawBase.trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.') ||
    window.location.hostname.endsWith('.local')
  );

  // Primary URL is always based on the configured VITE_API_URL
  let primaryUrl = endpoint.startsWith('http') ? endpoint : ((baseUrl && !isLocalHost) ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint);
  let fallbackUrl = '';

  // When running locally on localhost, always prioritize local direct/proxy endpoint to ensure real-time local DB access
  if (endpoint.startsWith('http')) {
    primaryUrl = endpoint;
  } else if (isLocalHost) {
    primaryUrl = cleanEndpoint;
    const localHost = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
      ? (window.location.hostname === '127.0.0.1' ? '127.0.0.1:5151' : 'localhost:5151')
      : `${window.location.hostname}:5151`;
    fallbackUrl = `http://${localHost}${cleanEndpoint}`;
  } else if (baseUrl) {
    primaryUrl = `${baseUrl}${cleanEndpoint}`;
  }

  // Setup abort controller if one wasn't passed in options
  let internalController: AbortController | null = null;
  let signal = options.signal;
  if (!signal) {
    internalController = new AbortController();
    signal = internalController.signal;
    activeAbortControllers.add(internalController);
  }

  let response: Response;
  try {
    try {
      response = await fetch(primaryUrl, {
        ...options,
        headers,
        signal,
      });
    } catch (fetchError: any) {
      if (fetchError?.name === 'AbortError') {
        throw fetchError;
      }
      if (fallbackUrl && fallbackUrl !== primaryUrl) {
        try {
          response = await fetch(fallbackUrl, {
            ...options,
            headers,
            signal,
          });
        } catch (fallbackError: any) {
          throw fallbackError || fetchError;
        }
      } else {
        throw fetchError;
      }
    }

    if (!response.ok && (response.status === 502 || response.status === 503 || response.status === 504 || response.status === 530) && fallbackUrl && fallbackUrl !== primaryUrl) {
      try {
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
          headers,
          signal,
        });
        if (fallbackRes.ok) {
          response = fallbackRes;
        }
      } catch { }
    }
  } finally {
    if (internalController) {
      activeAbortControllers.delete(internalController);
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !isAuthEndpoint) {
      if (token && token !== 'null' && token !== 'undefined' && !isHandlingSessionExpiry) {
        isHandlingSessionExpiry = true;
        try {
          const currentMod = localStorage.getItem('active_module');
          if (currentMod && currentMod !== 'dashboard') {
            localStorage.setItem('session_resume_module', currentMod);
          }
          localStorage.setItem('session_timeout_occurred', 'true');
        } catch {}
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token_timestamp');
        localStorage.removeItem('roles');
        try {
          window.dispatchEvent(new CustomEvent('auth_unauthorized'));
          window.dispatchEvent(new CustomEvent('session_expired'));
        } catch (e) {}
        setTimeout(() => {
          isHandlingSessionExpiry = false;
        }, 1000);
      }
    }

    let errorMessage = `HTTP error! status: ${response.status}`;
    if (response.status === 530) {
      errorMessage = `Backend Service Unavailable (HTTP 530): The proxy tunnel or backend server is unreachable. Please ensure the backend server is running on port 5151.`;
    } else if (response.status === 502) {
      errorMessage = `Gateway Error (502 Bad Gateway): The proxy server could not reach the backend API. Please make sure your backend dotnet server is running on port 5151.`;
    } else if (response.status === 503) {
      errorMessage = `Service Unavailable (503): Backend service is currently unavailable or restarting.`;
    }

    try {
      const errorBody = await response.text();
      const errorJson = JSON.parse(errorBody);

      if (errorJson.errors) {
        const validationErrors = Object.entries(errorJson.errors)
          .map(([key, messages]) => `${key}: ${(messages as string[]).join(', ')}`)
          .join(' | ');
        errorMessage = `${errorJson.title || 'Validation Error'}: ${validationErrors}`;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      } else if (errorJson.error) {
        errorMessage = errorJson.error;
      } else if (errorJson.title) {
        errorMessage = errorJson.title;
      } else if (errorBody) {
        errorMessage = errorBody;
      }
    } catch (e) {
      // Ignored
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  // Handle empty responses
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
};
