import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { AVATARS } from '../../utils/content';
import { StarCounter, ProgressBar } from '../../components/shared/Stars';
import Lenya from '../../components/shared/Lenya';
import { lessonsAPI } from '../../utils/api';

const LENYA_TIPS = [
  'Давай изучим новую букву! 📚',
  'Считать умеешь? Проверим! 🔢',
  'Отличный день для учёбы! ☀️',
  'Ты сможешь! Я верю в тебя! 💪',
];

export default function LearnHomePage() {
  const { activeChild, selectChild, childProfiles, isOnline, lenyaMessage, startLearningSession } = useApp();
  const [lessonStats, setLessonStats] = useState({ alphabetDone: 0, numbersDone: 0 });
  const navigate = useNavigate();
  const avatar = AVATARS.find(a => a.id === activeChild?.avatar) || AVATARS[0];
  const tip = LENYA_TIPS[Math.floor(Date.now() / 60000) % LENYA_TIPS.length];

  useEffect(() => {
    if (activeChild) {
      loadStats();
      startLearningSession(activeChild.id);
    }
  }, [activeChild?.id]);

  const loadStats = async () => {
    try {
      const [alpha, nums] = await Promise.all([
        lessonsAPI.list('alphabet', activeChild.id),
        lessonsAPI.list('numbers', activeChild.id),
      ]);
      setLessonStats({
        alphabetDone: alpha.filter(l => l.status === 'completed').length,
        numbersDone: nums.filter(l => l.status === 'completed').length,
      });
    } catch {}
  };

  const modules = [
    {
      id: 'alphabet',
      title: 'Буквы',
      subtitle: 'Русский алфавит',
      emoji: '🔤',
      progress: lessonStats.alphabetDone,
      total: 33,
      bg: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
      shadow: '#C44569',
      route: '/learn/alphabet',
    },
    {
      id: 'numbers',
      title: 'Числа',
      subtitle: 'Счёт до 20',
      emoji: '🔢',
      progress: lessonStats.numbersDone,
      total: 20,
      bg: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
      shadow: '#7C3AED',
      route: '/learn/numbers',
    },
    {
      id: 'games',
      title: 'Игры',
      subtitle: 'Мини-игры',
      emoji: '🎮',
      progress: null,
      bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      shadow: '#1D4ED8',
      route: '/learn/games',
      locked: lessonStats.alphabetDone < 5,
    },
    {
      id: 'achievements',
      title: 'Награды',
      subtitle: 'Достижения',
      emoji: '🏆',
      progress: null,
      bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      shadow: '#D97706',
      route: '/learn/achievements',
    },
    {
      id: 'cards',
      title: 'Коллекция',
      subtitle: 'Карточки Лёни',
      emoji: '🎴',
      progress: null,
      bg: 'linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)',
      shadow: '#5B21B6',
      route: '/learn/cards',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #EEF2FF 0%, #F5F3FF 100%)',
      paddingBottom: 24,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        padding: '20px 20px 32px',
        borderRadius: '0 0 32px 32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: avatar.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              border: '3px solid rgba(255,255,255,0.5)',
            }}>
              {avatar.emoji}
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Привет,</div>
              <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
                {activeChild?.name}!
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StarCounter total={activeChild?.total_stars || 0} />
            <button onClick={() => navigate('/profiles')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12, padding: '8px 12px', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-main)', fontWeight: 600 }}>
              ‹ Назад
            </button>
          </div>
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div style={{
            background: 'rgba(245,158,11,0.3)', borderRadius: 12, padding: '6px 14px',
            color: '#FEF3C7', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            📴 Офлайн-режим
          </div>
        )}
      </div>

      {/* Lenya mascot */}
      <div style={{ textAlign: 'center', marginTop: -20, position: 'relative', zIndex: 10 }}>
        <Lenya size="sm" message={lenyaMessage || tip} />
      </div>

      {/* Modules grid */}
      <div style={{ padding: '20px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <h3 style={{ marginBottom: 16, color: '#1E1B4B' }}>Что будем учить? 🎯</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {modules.map((mod, i) => (
            <button key={mod.id}
              className="animate-fadein"
              onClick={() => !mod.locked && navigate(mod.route)}
              style={{
                background: mod.locked ? '#E5E7EB' : mod.bg,
                border: 'none', borderRadius: 24, padding: '20px 16px',
                cursor: mod.locked ? 'not-allowed' : 'pointer',
                textAlign: 'left', color: mod.locked ? '#9CA3AF' : 'white',
                boxShadow: mod.locked ? 'none' : `0 6px 0 ${mod.shadow}`,
                transition: 'all 0.15s',
                animationDelay: `${i * 0.08}s`,
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!mod.locked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              onMouseDown={e => { if (!mod.locked) { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}}
              onMouseUp={e => { if (!mod.locked) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 0 ${mod.shadow}`; }}}
            >
              {mod.locked && (
                <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 16 }}>🔒</div>
              )}
              <div style={{ fontSize: 40, marginBottom: 8 }}>{mod.emoji}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{mod.title}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: mod.progress !== null ? 10 : 0 }}>
                {mod.locked ? `Открой после 5 букв` : mod.subtitle}
              </div>
              {mod.progress !== null && !mod.locked && (
                <div>
                  <ProgressBar value={mod.progress} max={mod.total} color="rgba(255,255,255,0.9)" height={8} />
                  <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 4 }}>
                    {mod.progress}/{mod.total}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Daily streak */}
        <div className="card" style={{ marginTop: 20, background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 44 }}>🔥</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#92400E', fontFamily: 'var(--font-title)' }}>
                Занимайся каждый день!
              </div>
              <div style={{ color: '#A16207', fontSize: '0.9rem' }}>
                Серия дней даёт больше звёзд ⭐
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
