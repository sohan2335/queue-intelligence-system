import axios from 'axios';

const TOKEN_KEY = 'qis_token';
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = t => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

const api = axios.create({ baseURL: '/api' });

// Attach the login token to every request.
api.interceptors.request.use(config => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the session expires, drop the token and let the app show the login page.
api.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      setStoredToken(null);
      window.dispatchEvent(new Event('qis:logout'));
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login       = body => api.post('/auth/login', body).then(r => r.data);
export const fetchMe     = ()   => api.get('/auth/me').then(r => r.data);

// ─── Visitor (user role) ─────────────────────────────────────────────────────
export const fetchMyTickets = ()   => api.get('/me/tickets').then(r => r.data);
export const takeTicket     = body => api.post('/me/tickets', body).then(r => r.data);
export const cancelTicket   = id   => api.patch(`/me/tickets/${id}/cancel`).then(r => r.data);

// ─── Shared ──────────────────────────────────────────────────────────────────
export const fetchCounters   = ()      => api.get('/counters').then(r => r.data);
export const fetchLocations  = (p={})  => api.get('/locations', { params: p }).then(r => r.data);
export const fetchTokenBoard = ()      => api.get('/tokens/board').then(r => r.data);
export const fetchHealth     = ()      => api.get('/health').then(r => r.data);

// ─── Admin ───────────────────────────────────────────────────────────────────
export const fetchDashboard    = ()      => api.get('/stats/dashboard').then(r => r.data);
export const fetchVisitors     = (p={})  => api.get('/visitors', { params: p }).then(r => r.data);
export const fetchQueueEntries = (p={})  => api.get('/queue-entries', { params: p }).then(r => r.data);
export const createQueueEntry  = body    => api.post('/queue-entries', body).then(r => r.data);
export const fetchPredictions  = (p={})  => api.get('/predictions', { params: p }).then(r => r.data);
export const lookupToken       = query   => api.get(`/tokens/lookup/${encodeURIComponent(query)}`).then(r => r.data);
export const dispenseToken     = body    => api.post('/tokens/dispense', body).then(r => r.data);
export const updateTokenStatus = (id, s) => api.patch(`/tokens/${id}/status`, { status: s }).then(r => r.data);
