import axios from 'axios';

// Dynamically use the current hostname so it works from phone/network
const API_URL = `http://${window.location.hostname}/eventrax/api/v1`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for PHP Sessions
});

export default api;
