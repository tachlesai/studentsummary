// src/config.js
// Use Vite's import.meta.env to determine the environment
const isDevelopment = import.meta.env.DEV;

// Get the client port (Vite uses a different port if the default is in use)
const clientPort = window.location.port || '5173';

// For development, we need to specify the full URL including the server port (5001)
// For production, we use the Railway domain with /api path

const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5001/api' 
  : `${window.location.origin}/api`;  // Use absolute path with origin in production

console.log('Environment:', isDevelopment ? 'Development' : 'Production');
console.log('Client Port:', clientPort);
console.log('API_BASE_URL:', API_BASE_URL);

export default API_BASE_URL;