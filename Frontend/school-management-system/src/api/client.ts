export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorBody = await response.text();
      const errorJson = JSON.parse(errorBody);
      if (errorJson.message) errorMessage = errorJson.message;
      else if (errorJson.error) errorMessage = errorJson.error;
      else if (errorBody) errorMessage = errorBody;
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
