import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 seconds - AI operations need more time (Google Places + Gemini)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🌐 API Request with auth:', config.method?.toUpperCase(), config.url);
    } else {
      console.log('🌐 API Request without auth:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('🌐 API Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('🌐 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('🌐 API Error:', error.response?.status, error.config?.url, error.response?.data);
    if (error.response?.status === 401) {
      console.log('🌐 Unauthorized - clearing auth and redirecting');
      // Clear token and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
