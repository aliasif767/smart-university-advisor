// services/api.js - Complete API Service Layer
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
    const token = sessionStorage.getItem('token');
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
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }
};

// ==================== STUDENT QUERY APIs ====================
export const queryAPI = {
  submitAcademic: (formData) => {
    return api.post('/students/queries/academic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  submitExam: (formData) => {
    return api.post('/students/queries/exam', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  submitLeave: (formData) => {
    return api.post('/students/queries/leave', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  submitOther: (formData) => {
    return api.post('/students/queries/other', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getMyQueries: (params = {}) => api.get('/students/queries/my-queries', { params }),
  getQuery: (id) => api.get(`/students/queries/${id}`),
  deleteQuery: (id) => api.delete(`/students/queries/${id}`)
};

// ==================== APPOINTMENT APIs ====================
export const appointmentAPI = {
  book: (data) => api.post('/students/appointments', data),
  getMyAppointments: () => api.get('/students/appointments/my-appointments'),
  cancel: (id) => api.patch(`/students/appointments/${id}/cancel`)
};

// ==================== STATISTICS APIs ====================
export const statsAPI = {
  getDashboard: () => api.get('/students/statistics/dashboard')
};

// ==================== STUDENT ATTENDANCE & MARKS APIs ====================
export const studentAcademicAPI = {
  getMyAttendance: (params = {}) => api.get('/students/academic/attendance', { params }),
  getMyMarks: (params = {}) => api.get('/students/academic/marks', { params }),
  getAttendanceSummary: () => api.get('/students/academic/attendance/summary'),
  getMarksSummary: () => api.get('/students/academic/marks/summary'),
  getAnnouncements: () => api.get('/students/announcements/public')
};

// ==================== TEACHER APIs ====================
export const teacherAPI = {
  getAssignedStudents: () => api.get('/teachers/students'),
  markAttendance: (data) => api.post('/teachers/attendance', data),
  updateAttendance: (id, data) => api.patch(`/teachers/attendance/${id}`, data),
  getAttendanceRecords: (params = {}) => api.get('/teachers/attendance', { params }),
  uploadMarks: (data) => api.post('/teachers/marks', data),
  updateMarks: (id, data) => api.patch(`/teachers/marks/${id}`, data),
  getMarksRecords: (params = {}) => api.get('/teachers/marks', { params }),
  getStudentQueries: (params = {}) => api.get('/teachers/queries', { params }),
  resolveQuery: (queryId, data) => api.patch(`/teachers/queries/${queryId}/resolve`, data),
  sendDataToAdvisor: (data) => api.post('/teachers/send-to-advisor', data),
  getTeacherStats: () => api.get('/teachers/statistics/dashboard'),
  getHOPAnnouncements: () => api.get('/hop/announcements/public')
};

// ==================== ADVISOR APIs ====================
export const advisorAPI = {
  assignStudent: (studentId, data) => api.patch(`/advisors/students/${studentId}/assign-section`, data),
  assignTeacher: (studentId, data) => api.patch(`/advisors/students/${studentId}/assign-teacher`, data),
  getStudents: (params = {}) => api.get('/advisors/students', { params }),
  getStudentDetails: (studentId) => api.get(`/advisors/students/${studentId}`),
  getAcademicRecords: (params = {}) => api.get('/advisors/academic-records', { params }),
  getStudentAttendance: (studentId, params = {}) => api.get(`/advisors/students/${studentId}/attendance`, { params }),
  getStudentMarks: (studentId, params = {}) => api.get(`/advisors/students/${studentId}/marks`, { params }),
  getQueries: (params = {}) => api.get('/advisors/queries', { params }),
  reviewQuery: (queryId, data) => api.patch(`/advisors/queries/${queryId}/review`, data),
  forwardToHOP: (queryId, data) => api.patch(`/advisors/queries/${queryId}/forward`, data),
  rejectQuery: (queryId, data) => api.patch(`/advisors/queries/${queryId}/reject`, data),
  getAdvisorStats: () => api.get('/advisors/statistics/dashboard'),
  getTeachers: () => api.get('/advisors/teachers'),
  getNotifications: () => api.get('/advisors/notifications'),
  markNotificationRead: (id) => api.patch(`/advisors/notifications/${id}/read`),
  confirmAppointment: (id, data) => api.patch(`/advisors/appointments/${id}/confirm`, data),
  cancelAppointment:  (id, data) => api.patch(`/advisors/appointments/${id}/cancel`,  data),
  getTeacherRecords: () => api.get('/advisors/teacher-records'),
  getSections: () => api.get('/advisors/sections'),
  assignTeacherToSection: (data) => api.patch('/advisors/sections/assign-teacher', data)
};
// ==================== HOP APIs ====================
export const hopAPI = {
  // Dashboard
  getStats:           () => api.get('/hop/statistics/dashboard'),

  // Queries (advisor-approved only)
  getQueries:         (params = {}) => api.get('/hop/queries', { params }),
  approveQuery:       (id, data)    => api.patch(`/hop/queries/${id}/approve`, data),
  rejectQuery:        (id, data)    => api.patch(`/hop/queries/${id}/reject`, data),

  // Appointments (advisor-confirmed only)
  getAppointments:    ()   => api.get('/hop/appointments'),
  completeAppointment:(id) => api.patch(`/hop/appointments/${id}/complete`),
  cancelAppointment:  (id) => api.patch(`/hop/appointments/${id}/cancel`),

  // Announcements
  getAnnouncements:   ()          => api.get('/hop/announcements'),
  getPublicAnnouncements: ()      => api.get('/hop/announcements/public'),
  createAnnouncement: (data)      => api.post('/hop/announcements', data),
  updateAnnouncement: (id, data)  => api.patch(`/hop/announcements/${id}`, data),
  deleteAnnouncement: (id)        => api.delete(`/hop/announcements/${id}`),
};
// ==================== APPROVAL APIs ====================
export const approvalAPI = {
  updateApproval: (queryId, data) => api.patch(`/students/queries/${queryId}/approve`, data)
};

export default api;