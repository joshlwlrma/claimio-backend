import axios from 'axios';

// Create an Axios instance pointing to the Laravel API
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Needed if we ever switch to sanctum SPA auth, good to have
});

// Add a request interceptor to attach the Sanctum token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('claimio_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
