import axios from 'axios';

// Single source of truth for axios configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
});

// Request interceptor — attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('ims_user');
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) {
          if (config.headers && config.headers.set) {
            config.headers.set('Authorization', `Bearer ${token}`);
          } else {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        }
      } catch {
        localStorage.removeItem('ims_user');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest.url.includes('/login')) {
      localStorage.removeItem('ims_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
