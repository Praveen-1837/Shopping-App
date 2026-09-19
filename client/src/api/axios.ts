import axios from 'axios';

// Automatically use relative path so requests route through the host (tunnel) origin, 
// which Vite will then proxy to localhost:5000 internally.
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear Clerk session on the frontend
      // We trigger a redirect to login. Clerk's Provider will naturally sync on reload.
      window.location.href = '/login?reason=session-expired';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
