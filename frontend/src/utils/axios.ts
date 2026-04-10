import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://b8eu4v15e5.execute-api.us-east-1.amazonaws.com/api',
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
      // Refresh failed — clear storage and redirect to login
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_verified');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
