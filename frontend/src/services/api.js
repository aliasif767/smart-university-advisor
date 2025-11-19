// services/api.js - API Service Layer
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ==================== STUDENT QUERY APIs ====================
export const queryAPI = {
  // Submit queries
  submitAcademic: (formData) => {
    return api.post('/student/queries/academic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  submitExam: (formData) => {
    return api.post('/student/queries/exam', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  submitLeave: (formData) => {
    return api.post('/student/queries/leave', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  submitOther: (formData) => {
    return api.post('/student/queries/other', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Get queries
  getMyQueries: (params = {}) => api.get('/student/queries/my-queries', { params }),
  getQuery: (id) => api.get(`/student/queries/${id}`),
  
  // Delete query
  deleteQuery: (id) => api.delete(`/student/queries/${id}`)
};

// ==================== APPOINTMENT APIs ====================
export const appointmentAPI = {
  book: (data) => api.post('/student/appointments', data),
  getMyAppointments: () => api.get('/student/appointments/my-appointments'),
  cancel: (id) => api.patch(`/student/appointments/${id}/cancel`)
};

// ==================== STATISTICS APIs ====================
export const statsAPI = {
  getDashboard: () => api.get('/student/statistics/dashboard')
};

// ==================== APPROVAL APIs (For Advisors) ====================
export const approvalAPI = {
  updateApproval: (queryId, data) => api.patch(`/student/queries/${queryId}/approve`, data)
};

export default api;