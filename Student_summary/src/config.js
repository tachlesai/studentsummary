// src/config.js
// Use Vite's import.meta.env to determine the environment
const isDevelopment = import.meta.env.DEV;

// Set the appropriate base URL
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5001/api' 
  : '/api';  // Use relative path in production

console.log('Environment:', isDevelopment ? 'Development' : 'Production');
console.log('API_BASE_URL:', API_BASE_URL);

export default API_BASE_URL;