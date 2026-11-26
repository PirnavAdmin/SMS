import { getSubdomain } from '../utils/subdomain';

let activeBranchHeader = '';
let activeBranchIdHeader = '';
let activeAcademicYearHeader = '';
let activeAcademicYearIdHeader = '';

export const setActiveBranchHeader = (b: string, id?: string) => {
  activeBranchHeader = b || '';
  if (id && /^\d+$/.test(id.trim())) {
    activeBranchIdHeader = id.trim();
  } else if (b && /^\d+$/.test(b.trim())) {
    activeBranchIdHeader = b.trim();
  } else {
    activeBranchIdHeader = '';
  }
};

export const setActiveAcademicYearHeader = (ay: string, id?: string) => {
  activeAcademicYearHeader = ay || '';
  if (id && /^\d+$/.test(id.trim())) {
    activeAcademicYearIdHeader = id.trim();
  } else if (ay && /^\d+$/.test(ay.trim())) {
    activeAcademicYearIdHeader = ay.trim();
  } else {
    activeAcademicYearIdHeader = '';
  }
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

  const isPublicAuthEndpoint =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/superadmin/login') ||
    endpoint.includes('/auth/otp/') ||
    endpoint.includes('/auth/forgot-password');

  const isAuthEndpoint = isPublicAuthEndpoint;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('ngrok-skip-browser-warning', 'true');
  const tenantIdentifier = getSubdomain();
  if (tenantIdentifier && !headers.has('X-Tenant-ID')) {
    headers.set('X-Tenant-ID', tenantIdentifier);
  }
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
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Automatically append branch and academic year query parameters for non-auth requests
  if (!isAuthEndpoint) {
    try {
      const dummyBase = 'http://localhost';
      const parsedUrl = new URL(cleanEndpoint, dummyBase);
      let paramsModified = false;
      if (branch && branch !== 'All Branches' && branch !== 'All') {
        if (!parsedUrl.searchParams.has('branch') && !parsedUrl.searchParams.has('branchId')) {
          parsedUrl.searchParams.set('branch', branch);
          if (activeBranchIdHeader) {
            parsedUrl.searchParams.set('branchId', activeBranchIdHeader);
          } else if (/^\d+$/.test(branch.trim())) {
            parsedUrl.searchParams.set('branchId', branch.trim());
          }
          paramsModified = true;
        }
      }
      if (academicYear && academicYear !== 'All') {
        if (!parsedUrl.searchParams.has('academicYear') && !parsedUrl.searchParams.has('academicYearId')) {
          parsedUrl.searchParams.set('academicYear', academicYear);
          if (activeAcademicYearIdHeader) {
            parsedUrl.searchParams.set('academicYearId', activeAcademicYearIdHeader);
          } else if (/^\d+$/.test(academicYear.trim())) {
            parsedUrl.searchParams.set('academicYearId', academicYear.trim());
          }
          paramsModified = true;
        }
      }
      if (paramsModified) {
        cleanEndpoint = parsedUrl.pathname + parsedUrl.search;
      }
    } catch {}
  }

  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.') ||
    window.location.hostname.endsWith('.local')
  );

  const forceRemoteProxy = (import.meta.env.VITE_FORCE_REMOTE_PROXY as string) === 'true';

  // Primary URL uses same-origin proxy on localhost/LAN and VITE_API_URL on hosted environments.
  let primaryUrl = cleanEndpoint;
  const fallbackUrls: string[] = [];

  if (endpoint.startsWith('http')) {
    primaryUrl = endpoint;
  } else if (isLocalHost) {
    primaryUrl = cleanEndpoint;
    if (!forceRemoteProxy && typeof window !== 'undefined' && window.location.protocol === 'http:') {
      const localHost = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
        ? (window.location.hostname === '127.0.0.1' ? '127.0.0.1:5151' : 'localhost:5151')
        : `${window.location.hostname}:5151`;
      fallbackUrls.push(`http://${localHost}${cleanEndpoint}`);
    }
    if (baseUrl) {
      const remoteCandidate = `${baseUrl}${cleanEndpoint}`;
      if (remoteCandidate !== primaryUrl && !fallbackUrls.includes(remoteCandidate)) {
        fallbackUrls.push(remoteCandidate);
      }
    }
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

  const isGatewayErrorStatus = (status: number) =>
    status === 502 || status === 503 || status === 504 || status === 530;

  let response: Response;
  try {
    let lastFetchError: any = null;
    let resolvedResponse: Response | null = null;
    const candidateUrls = [primaryUrl, ...fallbackUrls];

    for (const candidateUrl of candidateUrls) {
      try {
        const res = await fetch(candidateUrl, {
          ...options,
          headers,
          signal,
        });
        if (!isGatewayErrorStatus(res.status)) {
          resolvedResponse = res;
          break;
        }
        // Keep the latest gateway error response in case all fallbacks also return gateway errors.
        resolvedResponse = res;
      } catch (fetchError: any) {
        if (fetchError?.name === 'AbortError') {
          throw fetchError;
        }
        lastFetchError = fetchError;
      }
    }

    if (!resolvedResponse) {
      throw lastFetchError || new Error('Network request failed');
    }
    response = resolvedResponse;
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

  // Handle empty or malformed responses
  const text = await response.text();
  if (!text || !text.trim()) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch (parseError: any) {
    console.warn(`[apiClient] JSON parse warning for endpoint "${endpoint}":`, parseError?.message);
    if (text.trim().startsWith('<') || text.includes('530') || text.includes('Error')) {
      const err: any = new Error(`Server returned non-JSON response (Status ${response.status})`);
      err.status = response.status;
      throw err;
    }
    throw parseError;
  }
};
