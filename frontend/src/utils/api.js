import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Request interceptor for attaching the Bearer token
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            // Safely assign Authorization header
            config.headers.Authorization = `Bearer ${user.token}`;
            console.log(`[API Request] Token attached for ${config.url}`);
        } else {
            console.warn(`[API Request] No token found for ${config.url}`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        let message = 'An unexpected error occurred';

        if (error.response) {
            message = error.response.data.message || error.response.data.error || message;

            if (error.response.status === 401) {
                const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
                if (!isAuthPage) {
                    console.log('[API Response] 401 Unauthorized - redirecting to login');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        } else if (error.request) {
            message = 'No response from server. Please check your connection.';
        } else {
            message = error.message;
        }

        const isSilent = error.config?.silent;
        if (!isSilent) {
            toast.error(message, { toastId: message });
        }

        return Promise.reject(error);
    }
);

export default api;
