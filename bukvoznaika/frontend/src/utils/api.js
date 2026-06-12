const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Offline queue for sync
const OFFLINE_QUEUE_KEY = 'bukvoznaika_offline_queue';
const PROGRESS_CACHE_KEY = 'bukvoznaika_progress_cache';

function getQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
}
function saveQueue(q) { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q)); }

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

async function requestWithRefresh(method, path, body) {
  const token = localStorage.getItem('accessToken');
  try {
    return await request(method, path, body, token);
  } catch (err) {
    if (err.message === 'Недействительный токен') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { window.location.hash = '/login'; throw err; }
      try {
        const { accessToken } = await request('POST', '/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', accessToken);
        return await request(method, path, body, accessToken);
      } catch {
        localStorage.clear();
        window.location.hash = '/login';
        throw err;
      }
    }
    throw err;
  }
}

// Auth
export const authAPI = {
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  verifyPin: (pin) => requestWithRefresh('POST', '/auth/verify-pin', { pin }),
  setPin: (pin) => requestWithRefresh('POST', '/auth/set-pin', { pin }),
  pinStatus: () => requestWithRefresh('GET', '/auth/pin-status'),
};

// Children
export const childrenAPI = {
  list: () => requestWithRefresh('GET', '/children'),
  create: (data) => requestWithRefresh('POST', '/children', data),
  update: (id, data) => requestWithRefresh('PUT', `/children/${id}`, data),
  delete: (id) => requestWithRefresh('DELETE', `/children/${id}`),
  stats: (id) => requestWithRefresh('GET', `/children/${id}/stats`),
};

// Lessons with offline support
export const lessonsAPI = {
  list: async (type, childId) => {
    try {
      const data = await requestWithRefresh('GET', `/lessons?type=${type}&childId=${childId}`);
      // Cache for offline
      const cacheKey = `${PROGRESS_CACHE_KEY}_${childId}_${type}`;
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    } catch (err) {
      // Offline fallback
      const cacheKey = `${PROGRESS_CACHE_KEY}_${childId}_${type}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached).data;
      throw err;
    }
  },
  saveProgress: async (lessonId, childId, status, starsEarned) => {
    const progressData = { childId, status, starsEarned };
    try {
      return await requestWithRefresh('POST', `/lessons/${lessonId}/progress`, progressData);
    } catch {
      // Queue for later sync
      const queue = getQueue();
      queue.push({ lessonId, ...progressData, timestamp: Date.now() });
      saveQueue(queue);
      return { offline: true };
    }
  },
  startSession: (childId) => requestWithRefresh('POST', '/lessons/session/start', { childId }),
  endSession: (data) => requestWithRefresh('POST', '/lessons/session/end', data),
  syncOfflineQueue: async () => {
    const queue = getQueue();
    if (!queue.length) return;
    const remaining = [];
    for (const item of queue) {
      try {
        await requestWithRefresh('POST', `/lessons/${item.lessonId}/progress`, {
          childId: item.childId, status: item.status, starsEarned: item.starsEarned
        });
      } catch {
        remaining.push(item);
      }
    }
    saveQueue(remaining);
    return queue.length - remaining.length;
  }
};

// Cards collection
export const cardsAPI = {
  list: (childId) => requestWithRefresh('GET', `/cards?childId=${childId}`),
  openPack: (childId) => requestWithRefresh('POST', '/cards/open', { childId }),
};
