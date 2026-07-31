import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v4/test/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
