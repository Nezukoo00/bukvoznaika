import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { childrenAPI } from '../../utils/api';

const ALL_ACHIEVEMENTS = [
  { key: 'first_star', title: 'Первая звезда', description: 'Получи свою первую звезду', icon: '⭐', color: '#FEF3C7', border: '#F59E0B' },
  { key: 'five_stars', title: 'Коллекционер', description: 'Собери 5 звёзд', icon: '🌟', color: '#FEF3C7', border: '#F59E0B' },
  { key: 'fifty_stars', title: 'Звёздный', description: 'Собери 50 звёзд', icon: '💫', color: '#FEF9C3', border: '#EAB308' },
  { key: 'hundred_stars', title: 'Чемпион', description: 'Собери 100 звёзд', icon: '🏆', color: '#FEF9C3', border: '#CA8A04' },
  { key: 'ten_lessons', title: 'Ученик', description: 'Пройди 10 уроков', icon: '📚', color: '#DBEAFE', border: '#3B82F6' },
  { key: 'alphabet_master', title: 'Знаток букв', description: 'Выучи весь алфавит', icon: '🔤', color: '#FCE7F3', border: '#EC4899' },
  { key: 'number_master', title: 'Математик', description: 'Выучи все числа до 20', icon: '🔢', color: '#EDE9FE', border: '#8B5CF6' },
  { key: 'week_streak', title: 'Неделя!', description: 'Занимайся 7 дней подряд', icon: '🔥', color: '#FEE2E2', border: '#EF4444' },
];

export default function AchievementsPage() {
  const { activeChild } = useApp();
  const [earned, setEarned] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeChild) {
      childrenAPI.stats(activeChild.id)
        .then(data => setEarned(data.stats.achievements.map(a => a.key)))
        .catch(console.error);
    }
  }, [activeChild?.id]);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBEB' }}>
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        padding: '20px 20px 28px', borderRadius: '0 0 28px 28px',
      }}>
        <button onClick={() => navigate('/learn')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'white', cursor: 'pointer', marginBottom: 14, fontFamily: 'var(--font-main)', fontWeight: 600 }}>
          ‹ Назад
        </button>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-title)' }}>🏆 Достижения</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
          Получено: {earned.length} из {ALL_ACHIEVEMENTS.length}
        </p>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ALL_ACHIEVEMENTS.map((ach, i) => {
            const isEarned = earned.includes(ach.key);
            return (
              <div key={ach.key} className="animate-fadein"
                style={{
                  background: isEarned ? ach.color : '#F9FAFB',
                  border: `2px solid ${isEarned ? ach.border : '#E5E7EB'}`,
                  borderRadius: 20, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  opacity: isEarned ? 1 : 0.55,
                  animationDelay: `${i * 0.06}s`,
                }}>
                <div style={{ fontSize: 44, filter: isEarned ? 'none' : 'grayscale(1)', flexShrink: 0 }}>
                  {ach.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 800, color: isEarned ? '#1E1B4B' : '#9CA3AF' }}>
                    {ach.title}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: isEarned ? '#6B7280' : '#D1D5DB', marginTop: 2 }}>
                    {ach.description}
                  </div>
                </div>
                {isEarned && (
                  <div style={{ fontSize: 24 }}>✅</div>
                )}
                {!isEarned && (
                  <div style={{ fontSize: 20 }}>🔒</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
