export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<any> => {
  const token = localStorage.getItem('auth_token');
  const branch = localStorage.getItem('auth_branch') || '';
  const academicYear = localStorage.getItem('auth_academic_year') || '';

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

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('ngrok-skip-browser-warning', 'true');
  if (userRole) {
    headers.set('X-User-Role', userRole);
  }
  if (token && token !== 'null' && token !== 'undefined' && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (branch && branch !== 'All Branches' && branch !== 'All') {
    headers.set('X-Branch-Id', branch);
  }
  if (academicYear && academicYear !== 'All') {
    headers.set('X-Academic-Year-Id', academicYear);
  }

  let rawBaseUrl = ((import.meta.env.VITE_API_URL as string) || '').trim();
  if (typeof window !== 'undefined') {
    rawBaseUrl = '';
  }
  const baseUrl = rawBaseUrl;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  let response: Response | null = null;

  const tryFetch = async (fetchUrl: string): Promise<Response> => {
    return await fetch(fetchUrl, {
      ...options,
      headers,
    });
  };

  try {
    response = await tryFetch(url);
  } catch (fetchError) {
    // Perform a 1-time retry after 200ms on network error
    if (!isRetry) {
      await new Promise((res) => setTimeout(res, 200));
      return apiClient(endpoint, options, true);
    }
    throw fetchError;
  }

  // Handle 502/503/504 transient proxy error with a single automatic retry
  if (
    response &&
    !response.ok &&
    (response.status === 502 || response.status === 503 || response.status === 504) &&
    !isRetry
  ) {
    await new Promise((res) => setTimeout(res, 250));
    return apiClient(endpoint, options, true);
  }

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const hadToken = !!localStorage.getItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_timestamp');
      localStorage.removeItem('roles');
      localStorage.removeItem('active_module');
      if (hadToken) {
        window.dispatchEvent(new CustomEvent('session_expired'));
        window.location.reload();
      }
    }
    let errorMessage = `HTTP error! status: ${response.status}`;
    if (response.status === 502 || response.status === 503) {
      errorMessage = `Backend Service Unavailable (${response.status}): Connection dropped. Please retry.`;
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
  return text ? JSON.parse(text) : null;
};
