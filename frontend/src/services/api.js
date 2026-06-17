import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically inject the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally (e.g., unauthorized)
api.interceptors.response.use(
  (response) => response.data, // Return just the data part directly
  (error) => {
    const status = error.response ? error.response.status : null;
    let message = 'Có lỗi xảy ra, vui lòng thử lại sau';

    if (error.response && error.response.data) {
      message = error.response.data.message || message;
    }

    if (status === 401) {
      // Token expired or invalid, clear localStorage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      status,
      message,
      errors: error.response?.data?.errors || null,
    });
  }
);

export default api;
