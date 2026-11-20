import { getSubdomain } from '../utils/subdomain';

/**
 * Axios-compatible client and interceptor architecture
 */
export class AxiosHeaders {
  [key: string]: any;

  constructor(init?: Record<string, string>) {
    if (init) {
      Object.entries(init).forEach(([k, v]) => {
        this[k] = v;
      });
    }
  }

  set(name: string, value: string): void {
    this[name] = value;
  }

  get(name: string): string | undefined {
    return this[name];
  }

  has(name: string): boolean {
    return this[name] !== undefined;
  }
}

export interface InternalAxiosRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers: AxiosHeaders;
  params?: any;
  data?: any;
  timeout?: number;
}

export interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: InternalAxiosRequestConfig;
}

type ErrorInterceptor = (error: any) => any;

class InterceptorManager<T> {
  private handlers: Array<{ fulfilled: (val: any) => any; rejected?: ErrorInterceptor }> = [];

  use(fulfilled: (val: any) => any, rejected?: ErrorInterceptor): number {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  async run(input: any): Promise<any> {
    let current = input;
    for (const h of this.handlers) {
      try {
        current = await h.fulfilled(current);
      } catch (err) {
        if (h.rejected) {
          return await h.rejected(err);
        }
        throw err;
      }
    }
    return current;
  }

  async runError(error: any): Promise<any> {
    let currentError = error;
    for (const h of this.handlers) {
      if (h.rejected) {
        try {
          currentError = await h.rejected(currentError);
        } catch (err) {
          currentError = err;
        }
      }
    }
    throw currentError;
  }
}

export interface AxiosInstance {
  (config: InternalAxiosRequestConfig): Promise<AxiosResponse>;
  interceptors: {
    request: InterceptorManager<InternalAxiosRequestConfig>;
    response: InterceptorManager<AxiosResponse>;
  };
  get<T = any>(url: string, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>>;
  post<T = any>(url: string, data?: any, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>>;
  put<T = any>(url: string, data?: any, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>>;
  delete<T = any>(url: string, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>>;
}

const rawBase = (import.meta.env.VITE_API_URL as string) || '';
const defaultBaseUrl = rawBase.trim().replace(/\/+$/, '');

const requestInterceptors = new InterceptorManager<InternalAxiosRequestConfig>();
const responseInterceptors = new InterceptorManager<AxiosResponse>();

const executeRequest = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  let finalConfig = config;
  try {
    finalConfig = await requestInterceptors.run(config);
  } catch (err) {
    return Promise.reject(err);
  }

  const base = finalConfig.baseURL !== undefined ? finalConfig.baseURL : defaultBaseUrl;
  const cleanUrl = (finalConfig.url || '').startsWith('/') ? finalConfig.url : `/${finalConfig.url || ''}`;
  const fullUrl = (finalConfig.url || '').startsWith('http') ? finalConfig.url! : `${base}${cleanUrl}`;

  const headersRecord: Record<string, string> = {};
  if (finalConfig.headers) {
    Object.keys(finalConfig.headers).forEach((k) => {
      if (typeof finalConfig.headers[k] === 'string') {
        headersRecord[k] = finalConfig.headers[k];
      }
    });
  }

  try {
    const res = await fetch(fullUrl, {
      method: (finalConfig.method || 'GET').toUpperCase(),
      headers: headersRecord,
      body: finalConfig.data ? JSON.stringify(finalConfig.data) : undefined
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });

    const axiosResponse: AxiosResponse = {
      data,
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      config: finalConfig
    };

    if (!res.ok) {
      const errorObj = {
        response: axiosResponse,
        message: `Request failed with status code ${res.status}`
      };
      return await responseInterceptors.runError(errorObj);
    }

    return await responseInterceptors.run(axiosResponse);
  } catch (err) {
    return await responseInterceptors.runError(err);
  }
};

export const axiosClient: AxiosInstance = Object.assign(
  (config: InternalAxiosRequestConfig) => executeRequest(config),
  {
    interceptors: {
      request: requestInterceptors,
      response: responseInterceptors
    },
    get<T = any>(url: string, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>> {
      return executeRequest({
        url,
        method: 'GET',
        headers: new AxiosHeaders(config?.headers as any),
        ...config
      });
    },
    post<T = any>(url: string, data?: any, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>> {
      return executeRequest({
        url,
        method: 'POST',
        data,
        headers: new AxiosHeaders(config?.headers as any),
        ...config
      });
    },
    put<T = any>(url: string, data?: any, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>> {
      return executeRequest({
        url,
        method: 'PUT',
        data,
        headers: new AxiosHeaders(config?.headers as any),
        ...config
      });
    },
    patch<T = any>(url: string, data?: any, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>> {
      return executeRequest({
        url,
        method: 'PATCH',
        data,
        headers: new AxiosHeaders(config?.headers as any),
        ...config
      });
    },
    delete<T = any>(url: string, config?: Partial<InternalAxiosRequestConfig>): Promise<AxiosResponse<T>> {
      return executeRequest({
        url,
        method: 'DELETE',
        headers: new AxiosHeaders(config?.headers as any),
        ...config
      });
    }
  }
);

// =========================================================
// REQUEST INTERCEPTOR: Inject X-Tenant-ID & Authorization
// =========================================================
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  // 1. Resolve and attach X-Tenant-ID header
  const tenantIdentifier = getSubdomain();
  if (tenantIdentifier) {
    config.headers.set('X-Tenant-ID', tenantIdentifier);
  }

  // 2. Attach Authorization token if present
  const token = localStorage.getItem('auth_token');
  if (token && token !== 'null' && token !== 'undefined' && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  // 3. Attach optional context headers (Role, Branch, Academic Year)
  try {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.role) {
        config.headers.set('X-User-Role', parsed.role);
      }
    }
  } catch {}

  const branch = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('branch') || new URLSearchParams(window.location.search).get('branchId') || '')
    : '';
  if (branch && branch !== 'All Branches' && branch !== 'All') {
    config.headers.set('X-Branch-Id', branch);
  }

  config.headers.set('ngrok-skip-browser-warning', 'true');
  if (!config.headers.has('Content-Type')) {
    config.headers.set('Content-Type', 'application/json');
  }

  return config;
});

// =========================================================
// RESPONSE INTERCEPTOR: Handle Inactive Tenant (403) & 401
// =========================================================
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    if (error && error.response) {
      const { status, data } = error.response;

      // Handle deactivated / inactive client tenant
      if (status === 403 && (data?.error === 'TenantInactive' || data?.message?.includes('deactivated') || data?.message?.includes('inactive'))) {
        window.dispatchEvent(
          new CustomEvent('tenant_inactive_detected', {
            detail: { message: data?.message || 'Company account is currently inactive.' }
          })
        );
      }

      // Handle unauthenticated session
      if (status === 401) {
        window.dispatchEvent(new Event('auth_session_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
