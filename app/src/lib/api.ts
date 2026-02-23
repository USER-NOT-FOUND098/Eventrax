import axios from 'axios';

// In production: uses VITE_API_BASE_URL from .env.production (set to https://api.eventrax.qzz.io/v1)
// In development: falls back to localhost so local dev still works normally
const API_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}/eventrax/api/v1`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for PHP Sessions
});

export default api;
