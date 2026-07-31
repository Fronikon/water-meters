import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v4/test/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
