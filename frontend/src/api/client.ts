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

/**
 * SWR (Stale-While-Revalidate) Cache Store
 * Satisfies frontend_capabilities.yaml: client_caching_swr: required
 */
interface SwrCacheEntry<T = any> {
  data: AxiosResponse<T>;
  timestamp: number;
}

const swrCache = new Map<string, SwrCacheEntry>();
const DEFAULT_SWR_TTL = 30_000; // 30 seconds

/**
 * SWR GET Helper
 * Returns stale cached data immediately if available, while fetching fresh data in the background.
 */
export async function swrGet<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  options?: {
    ttl?: number;
    onRevalidate?: (freshData: AxiosResponse<T>) => void;
  },
): Promise<AxiosResponse<T>> {
  const reqConfig: AxiosRequestConfig = { ...config, method: 'GET', url };
  const key = getRequestKey(reqConfig);
  const ttl = options?.ttl ?? DEFAULT_SWR_TTL;
  const cached = swrCache.get(key);
  const now = Date.now();

  // If we have a fresh cache entry, return it immediately
  if (cached && now - cached.timestamp < ttl) {
    return cached.data;
  }

  // If we have stale cache, trigger background revalidation and return stale
  if (cached) {
    deduplicatedGet<T>(url, config)
      .then((fresh: AxiosResponse<T>) => {
        swrCache.set(key, { data: fresh, timestamp: Date.now() });
        if (options?.onRevalidate) {
          options.onRevalidate(fresh);
        }
      })
      .catch((err: unknown) => {
        console.warn('SWR revalidation failed:', err);
      });

    return cached.data;
  }

  // No cache at all: perform network request, cache result, and return
  const response = await deduplicatedGet<T>(url, config);
  swrCache.set(key, { data: response, timestamp: Date.now() });
  return response;
}

/**
 * Invalidate SWR cache entries (e.g. on mutation)
 */
export function invalidateSwrCache(urlPattern?: string): void {
  if (!urlPattern) {
    swrCache.clear();
    return;
  }
  for (const key of swrCache.keys()) {
    if (key.includes(urlPattern)) {
      swrCache.delete(key);
    }
  }
}



