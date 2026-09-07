import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': 'ar',
  },
});

// In-flight GET requests map for Request Deduplication
const inFlightRequests = new Map<string, Promise<AxiosResponse<any>>>();

function getRequestKey(config: AxiosRequestConfig): string {
  const method = (config.method || 'get').toUpperCase();
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method}:${url}:${params}`;
}

// Request Interceptor: Inject Bearer Token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('taqniya_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Global Errors (401, 403, 429) & Cleanup
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If request was canceled by AbortController, silently handle
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('taqniya_auth_token');
      localStorage.removeItem('taqniya_auth_user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Deduplicated GET helper (request_deduplication)
 * Re-uses an in-flight request if the exact same URL + query params is currently pending.
 */
export async function deduplicatedGet<T = any>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  const reqConfig: AxiosRequestConfig = { ...config, method: 'GET', url };
  const key = getRequestKey(reqConfig);

  // If already in-flight and not aborted, return existing promise
  if (!reqConfig.signal?.aborted && inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<AxiosResponse<T>>;
  }

  const promise = apiClient.get<T>(url, config).finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

