const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL.trim();
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return origin;
  }
  return 'http://localhost:5000';
};

export const API_URL = getBaseUrl();
export const API_BASE = `${API_URL}/api`;
