import axios from 'axios';
import Swal from 'sweetalert2';

// Production: requests go to "/api/*" on the same Vercel origin (wmsu-rdec.com),
// which Vercel rewrites to the AWS API Gateway. This makes auth cookies first-party
// and survives Chrome's third-party cookie blocking.
// Dev: set VITE_API_BASE_URL in .env.local to the AWS URL (or any dev API).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true
});

// 429 throttle toast: de-duplicated so a spam-click burst only shows one alert.
let lastThrottleAt = 0;
function showThrottleToast(retryAfterSeconds: number, message?: string) {
  const now = Date.now();
  if (now - lastThrottleAt < 2000) return; // squelch back-to-back
  lastThrottleAt = now;
  Swal.fire({
    icon: 'warning',
    title: 'Too many requests',
    text:
      message ??
      `You're doing that too fast. Please wait ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'} and try again.`,
    confirmButtonColor: '#C8102E',
    timer: Math.min(retryAfterSeconds * 1000, 5000),
    timerProgressBar: true,
  });
}

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

    // 429 rate-limit: surface the Retry-After window to the user and bail.
    // Must handle BEFORE the 401 refresh logic so a throttled request never
    // triggers a token refresh (which itself is throttle-prone).
    if (error.response?.status === 429) {
      const retryAfter = Number(error.response.headers?.['retry-after']) || 30;
      const serverMessage = error.response.data?.message;
      showThrottleToast(retryAfter, serverMessage);
      return Promise.reject(error);
    }

    // Detect 401 OR CORS-blocked authorizer response (no response object = browser blocked it).
    // The "Network Error" heuristic USED to fire for any no-response failure, including
    // cold-start timeouts and connection hiccups where the Lambda had already processed
    // the request. That caused a silent replay of non-idempotent POSTs (e.g. submit-revised),
    // which flooded `proposal_version` with phantom rows on every resubmit. Restrict the
    // heuristic to safe methods (GET/HEAD) — an explicit 401 still covers mutations because
    // the authorizer rejects BEFORE the handler runs, so retrying is safe.
    const is401 = error.response?.status === 401;
    const method = (originalRequest.method || 'get').toLowerCase();
    const isIdempotentMethod = method === 'get' || method === 'head';
    const isCorsBlocked =
      !error.response && error.message?.includes('Network Error') && isIdempotentMethod;
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
