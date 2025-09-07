import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Students API
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Progress API
export const progressAPI = {
  getAll: (studentId) => api.get(`/progress/student/${studentId}`),
  getById: (id) => api.get(`/progress/${id}`),
  create: (data) => api.post('/progress', data),
  update: (id, data) => api.put(`/progress/${id}`, data),
  delete: (id) => api.delete(`/progress/${id}`),
};

// Summaries API
export const summariesAPI = {
  getWeekly: (studentId, weekStart) => {
    const params = weekStart ? { week_start: weekStart } : {};
    return api.get(`/summaries/weekly/${studentId}`, { params });
  },
  getMonthly: (studentId, monthStart) => {
    const params = monthStart ? { month_start: monthStart } : {};
    return api.get(`/summaries/monthly/${studentId}`, { params });
  },
};

// Reports API
export const reportsAPI = {
  downloadWeekly: (studentId, weekStart) => {
    const params = weekStart ? { week_start: weekStart } : {};
    return api.get(`/reports/weekly/${studentId}`, { 
      params,
      responseType: 'blob'
    });
  },
  downloadMonthly: (studentId, monthStart) => {
    const params = monthStart ? { month_start: monthStart } : {};
    return api.get(`/reports/monthly/${studentId}`, { 
      params,
      responseType: 'blob'
    });
  },
  list: (studentId) => api.get(`/reports/list/${studentId}`),
};

export default api;
