import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://b8eu4v15e5.execute-api.us-east-1.amazonaws.com/api',
  withCredentials: true
})
