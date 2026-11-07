import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('signbridge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Authentication Expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      if (localStorage.getItem('signbridge_token')) {
        localStorage.removeItem('signbridge_token');
        localStorage.removeItem('signbridge_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
};

export const sessionAPI = {
  createSession: (data) => api.post('/sessions/start', data),
  getUserSessions: () => api.get('/sessions'),
  getSession: (id) => api.get(`/sessions/${id}`),
  postMessage: (sessionId, messageData) => api.post(`/sessions/${sessionId}/messages`, messageData),
  endSession: (sessionId) => api.patch(`/sessions/${sessionId}/end`),
};

export const aiAPI = {
  reconstructSentence: (glosses, history = []) => api.post('/ai/reconstruct', { glosses, history }),
  classifyLandmarks: (landmarks) => api.post('/ai/classify-landmarks', { landmarks }),
};

export default api;

