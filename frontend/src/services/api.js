import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for consistent error extraction
API.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    if (error.response) {
      if (error.response.data && error.response.data.detail) {
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail.map((err) => err.msg || err.message).join(', ');
        }
      } else {
        message = `Server returned error (${error.response.status}).`;
      }
    } else if (error.request) {
      message = 'Backend server is currently unavailable. Please make sure FastAPI backend is running on port 8000.';
    }
    return Promise.reject(new Error(message));
  }
);

export const getHealth = async () => {
  const response = await API.get('/api/health');
  return response.data;
};

export const getDashboard = async (userId = 1) => {
  const response = await API.get(`/api/dashboard/${userId}`);
  return response.data;
};

export const getCorridors = async (country = null) => {
  const params = country ? { country } : {};
  const response = await API.get('/api/corridors', { params });
  return response.data;
};

export const getDestinations = async () => {
  const response = await API.get('/api/destinations');
  return response.data;
};

export const compareRemittance = async (data) => {
  const response = await API.post('/api/remittance/compare', data);
  return response.data;
};

export const createDraft = async (data) => {
  const response = await API.post('/api/drafts', data);
  return response.data;
};

export const getDraft = async (id) => {
  const response = await API.get(`/api/drafts/${id}`);
  return response.data;
};

export const approveDraft = async (id) => {
  const response = await API.post(`/api/drafts/${id}/approve`, {});
  return response.data;
};

export const cancelDraft = async (id) => {
  const response = await API.post(`/api/drafts/${id}/cancel`, {});
  return response.data;
};

export const getGoals = async (userId = 1) => {
  const response = await API.get(`/api/goals/${userId}`);
  return response.data;
};

export const createGoal = async (data) => {
  const response = await API.post('/api/goals', data);
  return response.data;
};

export const allocateGoal = async (goalId, data) => {
  const response = await API.post(`/api/goals/${goalId}/allocate`, data);
  return response.data;
};

export const getActivity = async (userId = 1) => {
  const response = await API.get(`/api/activity/${userId}`);
  return response.data;
};

export const resetDemo = async () => {
  const response = await API.post('/api/demo/reset', {});
  return response.data;
};

export default API;
