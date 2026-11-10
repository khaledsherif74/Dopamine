const env = import.meta.env;

export const config = {
  apiBaseUrl: env.VITE_API_BASE_URL || '/api/v1',
  socketUrl: env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
};
