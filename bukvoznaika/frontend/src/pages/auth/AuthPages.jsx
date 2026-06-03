import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import Lenya from '../../components/shared/Lenya';

function AuthForm({ mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useApp();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/profiles');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
    }}>
      {/* Background bubbles */}
      {['#FFD93D','#FF6B9D','#74B9FF','#55EFC4'].map((c, i) => (
        <div key={i} style={{
          position: 'fixed', borderRadius: '50%', opacity: 0.15,
          background: c,
          width: [120, 80, 160, 60][i], height: [120, 80, 160, 60][i],
          top: ['10%', '70%', '5%', '85%'][i], left: ['5%', '80%', '75%', '15%'][i],
          animation: `float ${3 + i}s ease-in-out infinite`,
        }} />
      ))}

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Lenya size="md" />
          <h1 style={{ color: 'white', marginTop: 12, fontFamily: 'var(--font-title)' }}>
            Учёба с Лени
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', marginTop: 4 }}>
            {isLogin ? 'Добро пожаловать обратно!' : 'Создайте аккаунт родителя'}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Ваше имя</label>
                <input className="input" type="text" placeholder="Мама / Папа"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="example@mail.ru"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Пароль</label>
              <input className="input" type="password"
                placeholder={isLogin ? '••••••' : 'Минимум 6 символов'}
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && (
              <div className="animate-shake" style={{
                background: '#FEE2E2', border: '2px solid #EF4444',
                borderRadius: 12, padding: '10px 14px', marginBottom: 16,
                color: '#991B1B', fontWeight: 600, fontSize: '0.9rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="btn btn-secondary btn-block btn-lg" disabled={loading}>
              {loading ? '⏳ Загрузка...' : isLogin ? '🚀 Войти' : '🎉 Зарегистрироваться'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16, color: '#6B7280', fontSize: '0.95rem' }}>
            {isLogin ? (
              <>Нет аккаунта? <Link to="/register" style={{ color: '#A855F7', fontWeight: 700 }}>Зарегистрироваться</Link></>
            ) : (
              <>Уже есть аккаунт? <Link to="/login" style={{ color: '#A855F7', fontWeight: 700 }}>Войти</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() { return <AuthForm mode="login" />; }
export function RegisterPage() { return <AuthForm mode="register" />; }
