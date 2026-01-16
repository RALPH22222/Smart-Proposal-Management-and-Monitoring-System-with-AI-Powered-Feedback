import axios from 'axios';
import { API_URL } from '../constants/Config';

export const api = axios.create({
  baseURL: API_URL, 
  withCredentials: true,
  timeout: 15000, // Wait 15 seconds before timing out
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple error logging
api.interceptors.response.use(
  response => response,
  error => {
    // Log the error to your terminal so you can see if it fails
    if (error.response) {
      console.error("❌ Backend Error:", error.response.status, error.response.data);
    } else {
      console.error("❌ Network Error:", error.message);
    }
    return Promise.reject(error);
  }
);