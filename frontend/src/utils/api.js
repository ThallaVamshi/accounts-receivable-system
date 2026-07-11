import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Inject JWT token into headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ar_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors like unauthorized session expiry
api.interceptors.response.use(
  (response) => {
    return response.data; // Directly return the response data payload
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ar_token');
      localStorage.removeItem('ar_user');
      // Dispatch custom event to let App state know session expired
      window.dispatchEvent(new Event('auth_expired'));
    }
    
    // Extract server message or fallback
    const message = error.response?.data?.message || 'Something went wrong';
    const errors = error.response?.data?.errors || [];
    
    return Promise.reject({
      message,
      errors,
      originalError: error
    });
  }
);

export default api;
