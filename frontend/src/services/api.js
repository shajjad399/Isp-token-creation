// frontend/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// ✅ Dynamic URL - Environment Variable থেকে Load
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const ADMIN_API_URL = `${API_URL}/admin`;  // ✅ এভাবে Set করুন

// ============================================================
// MAIN API
// ============================================================
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ============================================================
// ADMIN API
// ============================================================
const adminApi = axios.create({
  baseURL: ADMIN_API_URL,  // ✅ Dynamic URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ... interceptors (same)
// ============================================================
// ADMIN API
// ============================================================
const adminApi = axios.create({
  baseURL: ADMIN_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ============================================================
// INTERCEPTORS
// ============================================================
const addInterceptors = (instance) => {
  // Request Interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (!error.response) {
        toast.error('Cannot connect to server');
        return Promise.reject(error);
      }

      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const response = await axios.post(`${API_URL}/auth/refresh-token`, { 
            refreshToken 
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('token', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          return Promise.reject(refreshError);
        }
      }

      if (error.response.status !== 401) {
        const message = error.response?.data?.message || 'An error occurred';
        toast.error(message);
      }

      return Promise.reject(error);
    }
  );
};

addInterceptors(api);
addInterceptors(adminApi);

export default api;
export { adminApi };