import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { ALPHABET_DATA } from '../../utils/content';
import { lessonsAPI } from '../../utils/api';
import { ProgressBar } from '../../components/shared/Stars';

export default function AlphabetMapPage() {
  const { activeChild } = useApp();
  const [progressByIndex, setProgressByIndex] = useState(new Array(33).fill(null));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    try {
      const lessons = await lessonsAPI.list('alphabet', activeChild.id);
      // lessons[i].order_index === 1..33, соответствует idx 0..32
      const arr = new Array(33).fill(null);
      lessons.forEach(l => {
        const idx = (l.order_index - 1);
        if (idx >= 0 && idx < 33) arr[idx] = l;
      });
      setProgressByIndex(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = progressByIndex.filter(p => p?.status === 'completed').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, animation: 'bounce 1s infinite' }}>📚</div>
        <p style={{ color: '#6B7280', marginTop: 12 }}>Загружаем уроки...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FFF9F0', paddingBottom: 32 }}>
      <div style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)', padding: '20px 20px 28px', borderRadius: '0 0 28px 28px' }}>
        <button onClick={() => navigate('/learn')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'white', cursor: 'pointer', marginBottom: 14, fontFamily: 'var(--font-main)', fontWeight: 600 }}>
          ‹ Назад
        </button>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-title)', marginBottom: 4 }}>🔤 Алфавит</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: 12 }}>
          Выучено: {completedCount} из 33 букв
        </p>
        <ProgressBar value={completedCount} max={33} color="rgba(255,255,255,0.9)" height={10} />
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {ALPHABET_DATA.map((letterData, idx) => {
            const prog = progressByIndex[idx];
            const status = prog?.status || 'not_started';
            const stars = prog?.stars_earned || 0;
            // Первая буква (А) всегда открыта. Остальные — только если предыдущая completed.
            const isLocked = idx > 0 && progressByIndex[idx - 1]?.status !== 'completed';

            return (
              <button
                key={letterData.letter}
                onClick={() => !isLocked && navigate(`/learn/alphabet/${idx}`)}
                style={{
                  aspectRatio: '1',
                  background: status === 'completed' ? letterData.color
                    : status === 'in_progress' ? `${letterData.color}55`
                    : isLocked ? '#F3F4F6' : 'white',
                  border: `3px solid ${status === 'completed' ? letterData.color : '#E5E7EB'}`,
                  borderRadius: 16,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-title)', transition: 'all 0.2s',
                  position: 'relative', overflow: 'visible',
                  boxShadow: status === 'completed' ? `0 4px 0 ${letterData.color}88` : '0 2px 6px rgba(0,0,0,0.06)',
                }}
              >
                {isLocked && <div style={{ position: 'absolute', top: -4, right: -4, fontSize: 11 }}>🔒</div>}
                {status === 'completed' && (
                  <div style={{ position: 'absolute', top: -6, right: -6, fontSize: 13, background: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>✅</div>
                )}
                <span style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 900, color: status === 'completed' ? 'white' : isLocked ? '#D1D5DB' : '#1E1B4B' }}>
                  {letterData.letter}
                </span>
                {stars > 0 && (
                  <div style={{ fontSize: 8, letterSpacing: -1, marginTop: 2 }}>{'⭐'.repeat(Math.min(stars, 3))}</div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ color: '#22C55E', label: 'Выучена' }, { color: '#A855F7', label: 'В процессе' }, { color: '#E5E7EB', label: 'Не начата' }].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#6B7280' }}>
              <div style={{ width: 14, height: 14, background: item.color, borderRadius: 4 }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
