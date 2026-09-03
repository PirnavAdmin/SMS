export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  const branch = localStorage.getItem('auth_branch') || 'Main Campus';
  const academicYear = localStorage.getItem('auth_academic_year') || '2026-2027';

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
  if (branch) {
    headers.set('X-Branch-Id', branch);
  }
  if (academicYear) {
    headers.set('X-Academic-Year-Id', academicYear);
  }

  const baseUrl = (import.meta.env.VITE_API_URL as string) || '';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (fetchError) {
    // If ngrok tunnel fails or hits limit on localhost, transparently fallback to direct backend port 5151
    if (url.includes('ngrok') && (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
      const localUrl = `http://127.0.0.1:5151${endpoint}`;
      try {
        response = await fetch(localUrl, {
          ...options,
          headers,
        });
      } catch {
        throw fetchError;
      }
    } else {
      throw fetchError;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const hadToken = !!localStorage.getItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      if (hadToken) {
        window.location.reload();
      }
    }
    let errorMessage = `HTTP error! status: ${response.status}`;
    if (response.status === 502) {
      errorMessage = `Gateway Error (502 Bad Gateway): The proxy server could not reach the backend API. Please make sure your backend dotnet server is running.`;
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
