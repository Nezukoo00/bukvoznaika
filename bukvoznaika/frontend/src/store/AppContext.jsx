import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, childrenAPI, lessonsAPI } from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [parent, setParent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('parent') || 'null'); } catch { return null; }
  });
  const [activeChild, setActiveChild] = useState(() => {
    try { return JSON.parse(localStorage.getItem('activeChild') || 'null'); } catch { return null; }
  });
  const [childProfiles, setChildProfiles] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [sessionStats, setSessionStats] = useState({ lessonsCompleted: 0, starsEarned: 0, exercisesCompleted: 0 });
  const [sessionStart, setSessionStart] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lenyaMessage, setLenyaMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      lessonsAPI.syncOfflineQueue();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    if (parent) loadChildProfiles();
  }, [parent]);

  const loadChildProfiles = async () => {
    try {
      const profiles = await childrenAPI.list();
      setChildProfiles(profiles);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('parent', JSON.stringify(data.parent));
    setParent(data.parent);
    return data;
  };

  const register = async (email, password, name) => {
    const data = await authAPI.register({ email, password, name });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('parent', JSON.stringify(data.parent));
    setParent(data.parent);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('parent');
    localStorage.removeItem('activeChild');
    setParent(null);
    setActiveChild(null);
    setChildProfiles([]);
  };

  const selectChild = (child) => {
    setActiveChild(child);
    localStorage.setItem('activeChild', JSON.stringify(child));
  };

  const startLearningSession = async (childId) => {
    try {
      const { sessionId: sid } = await lessonsAPI.startSession(childId);
      setSessionId(sid);
      setSessionStart(Date.now());
      setSessionStats({ lessonsCompleted: 0, starsEarned: 0, exercisesCompleted: 0 });
    } catch (err) {
      setSessionId('offline_' + Date.now());
      setSessionStart(Date.now());
    }
  };

  const endLearningSession = async (childId) => {
    if (!sessionId || !sessionStart) return;
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    try {
      if (!sessionId.startsWith('offline_')) {
        await lessonsAPI.endSession({
          sessionId, childId, durationSeconds: duration, ...sessionStats
        });
      }
    } catch (err) {
      console.error('Session end error:', err);
    }
    setSessionId(null);
    setSessionStart(null);
  };

  const addSessionStar = useCallback((stars = 1) => {
    setSessionStats(prev => ({ ...prev, starsEarned: prev.starsEarned + stars }));
  }, []);

  const addSessionLesson = useCallback(() => {
    setSessionStats(prev => ({ ...prev, lessonsCompleted: prev.lessonsCompleted + 1 }));
  }, []);

  const showLenya = useCallback((message, duration = 2500) => {
    setLenyaMessage(message);
    setTimeout(() => setLenyaMessage(null), duration);
  }, []);

  return (
    <AppContext.Provider value={{
      parent, activeChild, childProfiles, isOnline, loading, lenyaMessage, sessionStats,
      login, register, logout, selectChild, loadChildProfiles, setChildProfiles,
      startLearningSession, endLearningSession, addSessionStar, addSessionLesson, showLenya,
      setLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
