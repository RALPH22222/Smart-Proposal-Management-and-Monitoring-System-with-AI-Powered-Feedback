import axios from 'axios';
import { API_URL } from '../constants/Config';

console.log("🚀 [DEBUG] Axios configured with Base URL:", API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000, // Fail if request takes longer than 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- REQUEST INTERCEPTOR (Outgoing) ---
api.interceptors.request.use(request => {
  console.log('➡️ [REQUEST] Starting:', request.method?.toUpperCase(), request.url);
  console.log('   Full URL:', request.baseURL ? request.baseURL + request.url : request.url);
  return request;
}, error => {
  console.error('❌ [REQUEST ERROR]:', error);
  return Promise.reject(error);
});

// --- RESPONSE INTERCEPTOR (Incoming) ---
api.interceptors.response.use(response => {
  console.log('✅ [RESPONSE] Success:', response.status, response.config.url);
  return response;
}, error => {
  if (error.response) {
    // The server received the request and responded with an error (4xx, 5xx)
    console.error('❌ [SERVER ERROR]', error.response.status, error.response.data);
  } else if (error.request) {
    // The request was made but NO response was received (Network Error)
    console.error('❌ [NETWORK ERROR] No response received from server.');
    console.error('   Verify: 1. Internet connection? 2. Is AWS URL correct?');
    console.error('   Raw Request:', error.request);
  } else {
    // Something happened in setting up the request
    console.error('❌ [AXIOS ERROR]', error.message);
  }
  return Promise.reject(error);
});