import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { childrenAPI } from '../../utils/api';
import { AVATARS } from '../../utils/content';
import { StarCounter } from '../../components/shared/Stars';
import Lenya from '../../components/shared/Lenya';

export default function ProfilesPage() {
  const { parent, childProfiles, setChildProfiles, selectChild, logout, loadChildProfiles } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(6);
  const [newAvatar, setNewAvatar] = useState('bear');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSelectChild = (child) => {
    selectChild(child);
    navigate('/learn');
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const child = await childrenAPI.create({ name: newName, age: newAge, avatar: newAvatar });
      await loadChildProfiles();
      setShowCreate(false);
      setNewName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const bgColors = ['#FF6B9D', '#A855F7', '#3B82F6', '#14B8A6', '#22C55E', '#F59E0B'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)',
      padding: '32px 20px', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ color: 'white', fontFamily: 'var(--font-title)' }}>Привет, {parent?.name}!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>Кто будет учиться сегодня?</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/parent')}
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
            👨‍👩‍👧 Родитель
          </button>
          <button className="btn btn-ghost btn-sm" onClick={logout}
            style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
            Выйти
          </button>
        </div>
      </div>

      {/* Stars decorations */}
      {['⭐','🌟','✨','💫'].map((star, i) => (
        <div key={i} style={{
          position: 'fixed', fontSize: [24, 18, 28, 16][i],
          top: ['15%','45%','25%','70%'][i], left: ['8%','90%','85%','5%'][i],
          opacity: 0.4, animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
        }}>{star}</div>
      ))}

      {/* Lenya mascot */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Lenya size="md" message="Выбери свой профиль!" />
      </div>

      {/* Child profiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420, margin: '0 auto', width: '100%' }}>
        {childProfiles.map((child, i) => {
          const avatar = AVATARS.find(a => a.id === child.avatar) || AVATARS[0];
          return (
            <button key={child.id} onClick={() => handleSelectChild(child)}
              className="animate-fadein"
              style={{
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.2)', borderRadius: 24,
                padding: '18px 24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 18,
                transition: 'all 0.2s', textAlign: 'left',
                animationDelay: `${i * 0.1}s`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: avatar.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}>
                {avatar.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
                  {child.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: 3 }}>
                  {child.age} лет
                </div>
                <div style={{ marginTop: 6 }}>
                  <StarCounter total={child.total_stars} size="sm" />
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem' }}>›</div>
            </button>
          );
        })}

        {/* Add child button */}
        {childProfiles.length < 3 && (
          <button onClick={() => setShowCreate(true)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '2px dashed rgba(255,255,255,0.3)',
              borderRadius: 24, padding: '20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: 600,
              fontFamily: 'var(--font-main)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <span style={{ fontSize: 28 }}>➕</span>
            Добавить ребёнка
          </button>
        )}

        {childProfiles.length === 0 && !showCreate && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👶</div>
            <p>Добавьте первый профиль ребёнка</p>
          </div>
        )}
      </div>

      {/* Create profile modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
          padding: '0 0 0 0',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="animate-pop" style={{
            background: 'white', borderRadius: '28px 28px 0 0',
            padding: '28px 24px', width: '100%', maxWidth: 480,
          }}>
            <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-title)' }}>👶 Новый профиль</h3>

            <form onSubmit={handleCreateChild}>
              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Имя ребёнка</label>
                <input className="input" type="text" placeholder="Маша, Ваня..." autoFocus
                  value={newName} onChange={e => setNewName(e.target.value)} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Возраст: {newAge} лет</label>
                <input type="range" min="4" max="8" value={newAge} onChange={e => setNewAge(+e.target.value)}
                  style={{ width: '100%', accentColor: '#A855F7' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '0.8rem' }}>
                  <span>4</span><span>8</span>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="input-label">Аватар</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  {AVATARS.map(av => (
                    <button key={av.id} type="button"
                      onClick={() => setNewAvatar(av.id)}
                      style={{
                        width: 56, height: 56, borderRadius: '50%', background: av.bg,
                        border: newAvatar === av.id ? '3px solid #A855F7' : '3px solid transparent',
                        fontSize: 28, cursor: 'pointer', transition: 'all 0.15s',
                        transform: newAvatar === av.id ? 'scale(1.15)' : 'scale(1)',
                      }}>
                      {av.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p style={{ color: '#EF4444', marginBottom: 12, fontSize: '0.9rem' }}>⚠️ {error}</p>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}
                  style={{ flex: 1 }}>Отмена</button>
                <button type="submit" className="btn btn-secondary" disabled={creating}
                  style={{ flex: 2 }}>
                  {creating ? '⏳...' : '🎉 Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
