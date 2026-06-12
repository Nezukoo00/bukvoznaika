import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { childrenAPI } from '../../utils/api';
import { AVATARS } from '../../utils/content';
import { ProgressBar, StarCounter } from '../../components/shared/Stars';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

export default function ParentDashboard() {
  const { parent, childProfiles, logout, loadChildProfiles } = useApp();
  const [selectedChild, setSelectedChild] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');
  // PIN-гейт: нужно ли запросить PIN при входе в кабинет
  const [pinGate, setPinGate] = useState(false);       // показывать экран ввода
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateChecking, setGateChecking] = useState(true);
  const [pinSaved, setPinSaved] = useState(false);     // PIN установлен (для отметки в настройках)
  const { authAPI } = require('../../utils/api');
  const navigate = useNavigate();

  // При входе проверяем, установлен ли PIN — если да, показываем гейт
  useEffect(() => {
    (async () => {
      try {
        const { hasPin } = await authAPI.pinStatus();
        setPinGate(hasPin);
        setPinSaved(hasPin);
      } catch (e) {
        setPinGate(false);
      } finally {
        setGateChecking(false);
      }
    })();
  }, []);

  const submitGate = async () => {
    try {
      const { valid } = await authAPI.verifyPin(gateInput);
      if (valid) {
        setPinGate(false);
        setGateInput('');
        setGateError('');
      } else {
        setGateError('Неверный PIN-код');
        setGateInput('');
      }
    } catch (e) {
      setGateError('Ошибка проверки');
    }
  };

  useEffect(() => { loadChildProfiles(); }, []);

  useEffect(() => {
    if (selectedChild) loadChildStats(selectedChild.id);
  }, [selectedChild]);

  useEffect(() => {
    if (childProfiles.length > 0 && !selectedChild) {
      setSelectedChild(childProfiles[0]);
    }
  }, [childProfiles]);

  const loadChildStats = async (childId) => {
    setStatsLoading(true);
    try {
      const data = await childrenAPI.stats(childId);
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setStatsLoading(false); }
  };

  const weeklyData = stats?.stats.weeklyUsage.map(d => ({
    day: new Date(d.date).toLocaleDateString('ru', { weekday: 'short' }),
    минуты: d.total_minutes,
  })) || [];

  const pieData = stats ? [
    { name: 'Буквы', value: stats.stats.alphabet.completed, color: '#FF6B9D' },
    { name: 'Числа', value: stats.stats.numbers.completed, color: '#A855F7' },
    { name: 'Не начато', value: (33 - stats.stats.alphabet.completed) + (20 - stats.stats.numbers.completed), color: '#E5E7EB' },
  ] : [];

  // Пока проверяем статус PIN — ничего не показываем
  if (gateChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, animation: 'bounce 1s infinite' }}>🔐</div>
          <p style={{ color: '#6B7280', marginTop: 12 }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Экран ввода PIN-кода (гейт)
  if (pinGate) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6D28D9, #A855F7)', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔐</div>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-title)', marginBottom: 8 }}>Родительский контроль</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 24, textAlign: 'center' }}>
          Введите PIN-код для доступа в кабинет
        </p>
        <input
          type="password" inputMode="numeric" autoFocus
          placeholder="••••" value={gateInput}
          onChange={e => setGateInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => { if (e.key === 'Enter' && gateInput.length === 4) submitGate(); }}
          style={{
            fontSize: 32, textAlign: 'center', letterSpacing: 12, width: 200,
            padding: '12px', borderRadius: 16, border: 'none', marginBottom: 16,
            fontFamily: 'var(--font-title)',
          }}
        />
        {gateError && <p style={{ color: '#FECACA', marginBottom: 16, fontWeight: 600 }}>⚠️ {gateError}</p>}
        <div style={{ display: 'flex', gap: 12, width: 280 }}>
          <button className="btn btn-ghost" style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: 'white' }}
            onClick={() => navigate('/profiles')}>
            Назад
          </button>
          <button className="btn btn-secondary" style={{ flex: 2 }}
            disabled={gateInput.length !== 4} onClick={submitGate}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E5E7EB',
        padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem' }}>👨‍👩‍👧 Родительский кабинет</h2>
          <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>{parent?.name} · {parent?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profiles')}>← Профили</button>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ color: '#EF4444', borderColor: '#FEE2E2' }}>Выйти</button>
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px' }}>
        {/* Child selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {childProfiles.map(child => {
            const av = AVATARS.find(a => a.id === child.avatar) || AVATARS[0];
            const active = selectedChild?.id === child.id;
            return (
              <button key={child.id} onClick={() => setSelectedChild(child)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 16px', borderRadius: 18, border: 'none', cursor: 'pointer',
                  background: active ? '#EDE9FE' : 'white',
                  outline: active ? '2px solid #A855F7' : '1px solid #E5E7EB',
                  flexShrink: 0, transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 28 }}>{av.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: active ? '#7C3AED' : '#374151' }}>
                  {child.name}
                </span>
              </button>
            );
          })}
          <button onClick={() => navigate('/profiles')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: 18, border: '2px dashed #D1D5DB', cursor: 'pointer', background: 'transparent', flexShrink: 0, color: '#9CA3AF', fontSize: '0.85rem', fontWeight: 600 }}>
            <span style={{ fontSize: 24 }}>➕</span>
            Добавить
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 16, padding: 4, marginBottom: 20 }}>
          {[['overview','📊 Обзор'], ['progress','📚 Прогресс'], ['settings','⚙️ Настройки']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px 4px', border: 'none', borderRadius: 12, cursor: 'pointer',
                background: activeTab === tab ? 'white' : 'transparent',
                fontFamily: 'var(--font-main)', fontWeight: 700, fontSize: '0.85rem',
                color: activeTab === tab ? '#1E1B4B' : '#6B7280',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>
              {label}
            </button>
          ))}
        </div>

        {statsLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, animation: 'bounce 1s infinite' }}>📊</div>
            <p style={{ marginTop: 8 }}>Загружаем статистику...</p>
          </div>
        )}

        {!statsLoading && stats && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="animate-fadein">
                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Звёзд собрано', value: stats.child.total_stars, emoji: '⭐', color: '#FEF3C7', text: '#92400E' },
                    { label: 'Уровень', value: stats.child.current_level, emoji: '🏆', color: '#EDE9FE', text: '#6B21A8' },
                    { label: 'Букв выучено', value: `${stats.stats.alphabet.completed}/33`, emoji: '🔤', color: '#FCE7F3', text: '#9D174D' },
                    { label: 'Чисел выучено', value: `${stats.stats.numbers.completed}/20`, emoji: '🔢', color: '#EDE9FE', text: '#6B21A8' },
                  ].map(card => (
                    <div key={card.label} style={{ background: card.color, borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 32 }}>{card.emoji}</span>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: card.text }}>{card.value}</div>
                        <div style={{ fontSize: '0.78rem', color: card.text, opacity: 0.8, fontWeight: 600 }}>{card.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Weekly usage chart */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>📅 Использование за неделю (минуты)</h3>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="day" tick={{ fontSize: 12, fontFamily: 'var(--font-main)' }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [`${v} мин`, '']} labelStyle={{ fontFamily: 'var(--font-main)' }} />
                        <Bar dataKey="минуты" fill="#A855F7" radius={[8,8,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '30px 0' }}>
                      <p>Данных пока нет</p>
                    </div>
                  )}
                </div>

                {/* Progress pie */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>📊 Общий прогресс</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie data={pieData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1 }}>
                      {pieData.map(d => (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>{d.name}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', marginLeft: 'auto' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                {stats.stats.achievements.length > 0 && (
                  <div className="card">
                    <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>🏅 Достижения</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {stats.stats.achievements.map(a => (
                        <div key={a.id} className="badge badge-yellow" style={{ fontSize: '0.85rem' }}>
                          {a.icon} {a.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="animate-fadein">
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>🔤 Буквы ({stats.stats.alphabet.completed}/33)</h3>
                  <ProgressBar value={stats.stats.alphabet.completed} max={33} color="#FF6B9D" height={12} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 12 }}>
                    {stats.stats.alphabet.lessons.map((l, i) => (
                      <div key={i} style={{
                        aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: l.status === 'completed' ? '#FCE7F3' : l.status === 'in_progress' ? '#FEF3C7' : '#F3F4F6',
                        fontSize: '0.75rem', fontWeight: 800, color: l.status === 'completed' ? '#9D174D' : '#6B7280',
                        fontFamily: 'var(--font-title)',
                      }}>
                        {l.title?.split(' ')[1] || '?'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>🔢 Числа ({stats.stats.numbers.completed}/20)</h3>
                  <ProgressBar value={stats.stats.numbers.completed} max={20} color="#A855F7" height={12} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 12 }}>
                    {stats.stats.numbers.lessons.map((l, i) => (
                      <div key={i} style={{
                        aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: l.status === 'completed' ? '#EDE9FE' : l.status === 'in_progress' ? '#FEF3C7' : '#F3F4F6',
                        fontSize: '0.85rem', fontWeight: 900, color: l.status === 'completed' ? '#6B21A8' : '#9CA3AF',
                        fontFamily: 'var(--font-title)',
                      }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sessions */}
                {stats.stats.recentSessions.length > 0 && (
                  <div className="card">
                    <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>📋 Последние занятия</h3>
                    {stats.stats.recentSessions.slice(0, 5).map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {new Date(s.started_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                          </div>
                          <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                            {Math.round((s.duration_seconds || 0) / 60)} мин · {s.lessons_completed} уроков
                          </div>
                        </div>
                        <div className="badge badge-yellow">⭐ {s.stars_earned}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="animate-fadein">
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>⏱️ Лимит времени — {selectedChild?.name}</h3>
                  <label style={{ display: 'block', marginBottom: 8, color: '#6B7280', fontSize: '0.9rem' }}>
                    Лимит в день: <strong>{selectedChild?.daily_limit_minutes} минут</strong>
                  </label>
                  <input type="range" min="15" max="180" step="15"
                    defaultValue={selectedChild?.daily_limit_minutes || 60}
                    style={{ width: '100%', accentColor: '#A855F7' }}
                    onChange={async (e) => {
                      await childrenAPI.update(selectedChild.id, { daily_limit_minutes: +e.target.value });
                      await loadChildProfiles();
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '0.8rem', marginTop: 4 }}>
                    <span>15 мин</span><span>3 часа</span>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>🔐 PIN-код родителя</h3>
                  <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: 12 }}>
                    Защитите родительский кабинет 4-значным PIN-кодом
                  </p>
                  {pinSaved && (
                    <p style={{ color: '#16A34A', fontSize: '0.9rem', marginBottom: 12, fontWeight: 600 }}>
                      ✅ PIN-код установлен. При следующем входе в кабинет он будет запрошен.
                    </p>
                  )}
                  <button className="btn btn-secondary btn-block" onClick={() => setPinModal(true)}>
                    🔐 {pinSaved ? 'Изменить PIN-код' : 'Установить PIN-код'}
                  </button>
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>📊 Еженедельные отчёты</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#374151', fontSize: '0.9rem' }}>Получать отчёты на email</span>
                    <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26 }}>
                      <input type="checkbox" defaultChecked style={{ display: 'none' }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: '#A855F7', borderRadius: 999 }}>
                        <span style={{ position: 'absolute', left: 22, top: 3, width: 20, height: 20, background: 'white', borderRadius: '50%' }} />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {childProfiles.length === 0 && !statsLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 60 }}>👶</div>
            <p style={{ marginTop: 12 }}>Добавьте профиль ребёнка</p>
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/profiles')}>
              Добавить ребёнка
            </button>
          </div>
        )}
      </div>

      {/* PIN Modal */}
      {pinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setPinModal(false); }}>
          <div className="card animate-pop" style={{ width: '100%', maxWidth: 320 }}>
            <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-title)', textAlign: 'center' }}>🔐 PIN-код</h3>
            <input className="input" type="password" inputMode="numeric" maxLength={4}
              placeholder="4 цифры" value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em', marginBottom: 12 }} autoFocus />
            {pinError && <p style={{ color: '#EF4444', textAlign: 'center', marginBottom: 12, fontSize: '0.9rem' }}>⚠️ {pinError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setPinModal(false); setPinInput(''); }}>Отмена</button>
              <button className="btn btn-secondary" style={{ flex: 2 }} disabled={pinInput.length !== 4}
                onClick={async () => {
                  try {
                    const { authAPI: api } = await import('../../utils/api');
                    await api.setPin(pinInput);
                    setPinModal(false); setPinInput(''); setPinError(''); setPinSaved(true);
                  } catch (e) { setPinError(e.message); }
                }}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
