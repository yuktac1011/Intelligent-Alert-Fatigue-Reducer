export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get WS url based on API_URL
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (
  API_URL.startsWith('https') 
    ? API_URL.replace('https', 'wss') 
    : API_URL.replace('http', 'ws')
);
