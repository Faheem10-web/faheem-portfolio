const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    const clean = envUrl.trim().replace(/\/+$/, '');
    if (clean === '/api' || clean.endsWith('/api')) {
      return clean;
    }
    return `${clean}/api`;
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
    return `${origin}/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE = getBaseUrl();
export const API_URL = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

