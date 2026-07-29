import axios from 'axios';

let backendUrl = import.meta.env.VITE_API_URL || '/api';
if (import.meta.env.VITE_API_URL && !backendUrl.endsWith('/api') && !backendUrl.endsWith('/api/')) {
  backendUrl = backendUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // support HttpOnly refresh token cookie
});

let store = {
  accessToken: null,
  setAccessToken: (token) => {
    store.accessToken = token;
  }
};

export const setGlobalAccessToken = (token) => {
  store.setAccessToken(token);
};

// Request Interceptor: Attach JWT
api.interceptors.request.use(
  (config) => {
    if (store.accessToken) {
      config.headers.Authorization = `Bearer ${store.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Refresh JWT
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Catch 401 unauthorized & verify we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Request token refresh from backend
        const response = await axios.post(`${backendUrl}/auth/refresh-token`, {}, { withCredentials: true });
        const { accessToken } = response.data;
        
        setGlobalAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Silent session refresh failed:', refreshError.message);
        // Clear tokens and redirect
        setGlobalAccessToken(null);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
