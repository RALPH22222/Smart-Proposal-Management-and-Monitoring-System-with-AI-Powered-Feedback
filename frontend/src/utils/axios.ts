import axios from 'axios';

// Production: requests go to "/api/*" on the same Vercel origin (wmsu-rdec.com),
// which Vercel rewrites to the AWS API Gateway. This makes auth cookies first-party
// and survives Chrome's third-party cookie blocking.
// Dev: set VITE_API_BASE_URL in .env.local to the AWS URL (or any dev API).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true
});

// --- Silent token refresh on 401 ---

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect 401 OR CORS-blocked authorizer response (no response object = browser blocked it)
    const is401 = error.response?.status === 401;
    const isCorsBlocked = !error.response && error.message?.includes('Network Error');
    const isAuthFailure = is401 || isCorsBlocked;

    // Only intercept auth failures, skip if already retried or if this IS the refresh/login call
    if (
      !isAuthFailure ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => {
        originalRequest._retry = true;
        return api(originalRequest);
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      await api.post('/auth/refresh-token', {}, { withCredentials: true });
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Refresh failed — session is gone (cookies cleared, expired, or
      // invalidated because another tab completed an invite / logged in
      // as a different account). Leave a flag for /login to read so the
      // user gets a clear "you were signed out" notice instead of a
      // silent redirect.
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_verified');
      sessionStorage.setItem('auth_redirect_reason', 'session_ended');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
