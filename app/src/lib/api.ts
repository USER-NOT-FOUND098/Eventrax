import axios from 'axios';

// Automatically point to the XAMPP API folder on whatever local IP or hostname the React app is served from
const API_URL = `http://${window.location.hostname}/eventrax/api/v1`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for PHP Sessions
});

export default api;
