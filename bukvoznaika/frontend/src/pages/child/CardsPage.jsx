import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { cardsAPI } from '../../utils/api';
import { StarCounter } from '../../components/shared/Stars';
import Lenya from '../../components/shared/Lenya';

const RARITY = {
  common:    { label: 'Обычная',    color: '#94A3B8', glow: 'rgba(148,163,184,0.5)' },
  rare:      { label: 'Редкая',     color: '#3B82F6', glow: 'rgba(59,130,246,0.6)' },
  epic:      { label: 'Эпическая',  color: '#A855F7', glow: 'rgba(168,85,247,0.6)' },
  legendary: { label: 'Легендарная',color: '#F59E0B', glow: 'rgba(245,158,11,0.7)' },
};

export default function CardsPage() {
  const { activeChild, loadChildProfiles } = useApp();
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [totalStars, setTotalStars] = useState(0);
  const [packCost, setPackCost] = useState(15);
  const [loading, setLoading] = useState(true);

  // Состояние анимации открытия пакета
  const [phase, setPhase] = useState('idle'); // idle | shaking | revealing | done
  const [revealed, setRevealed] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await cardsAPI.list(activeChild.id);
      setCards(data.cards);
      setTotalStars(data.totalStars);
      setPackCost(data.packCost);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openPack = async () => {
    if (totalStars < packCost || phase !== 'idle') return;
    setError('');
    setPhase('shaking');

    // Даём пакету подрожать, потом запрашиваем карточку
    setTimeout(async () => {
      try {
        const result = await cardsAPI.openPack(activeChild.id);
        setRevealed(result);
        setTotalStars(result.remainingStars);
        setPhase('revealing');
        // обновим профиль (звёзды) и коллекцию
        loadChildProfiles();
        load();
      } catch (err) {
        setError(err.message || 'Не удалось открыть набор');
        setPhase('idle');
      }
    }, 1200);
  };

  const closeReveal = () => {
    setPhase('idle');
    setRevealed(null);
  };

  const ownedCount = cards.filter(c => c.owned).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, animation: 'bounce 1s infinite' }}>🎴</div>
        <p style={{ color: '#6B7280', marginTop: 12 }}>Загружаем коллекцию...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #EEF2FF 0%, #F5F3FF 100%)', paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)', padding: '20px 20px 28px', borderRadius: '0 0 28px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => navigate('/learn')}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-main)', fontWeight: 600 }}>
            ‹ Назад
          </button>
          <StarCounter total={totalStars} />
        </div>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-title)' }}>🎴 Коллекция Лёни</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
          Собрано: {ownedCount} из {cards.length} карточек
        </p>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        {/* Кнопка открытия пакета */}
        <div className="card" style={{ marginBottom: 24, textAlign: 'center', background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎁</div>
          <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: 6 }}>Набор карточек</h3>
          <p style={{ color: '#A16207', fontSize: '0.9rem', marginBottom: 16 }}>
            Открой набор и получи карточку Лёни!
          </p>
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={openPack}
            disabled={totalStars < packCost || phase !== 'idle'}
            style={{ opacity: totalStars < packCost ? 0.5 : 1 }}
          >
            Открыть за ⭐ {packCost}
          </button>
          {totalStars < packCost && (
            <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: 10 }}>
              Не хватает звёзд — пройди ещё уроки! ⭐
            </p>
          )}
          {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: 10 }}>⚠️ {error}</p>}
        </div>

        {/* Сетка карточек */}
        <h3 style={{ marginBottom: 14, color: '#1E1B4B' }}>Мои карточки</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {cards.map(card => {
            const rarity = RARITY[card.rarity] || RARITY.common;
            return (
              <div key={card.id} style={{
                borderRadius: 18, overflow: 'hidden', position: 'relative',
                aspectRatio: '5 / 7',
                background: card.owned ? 'white' : '#E5E7EB',
                border: `3px solid ${card.owned ? rarity.color : '#D1D5DB'}`,
                boxShadow: card.owned ? `0 4px 16px ${rarity.glow}` : 'none',
              }}>
                {card.owned ? (
                  <>
                    <img src={card.image} alt={card.title}
                      style={{ width: '100%', height: '78%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '6px 8px' }}>
                      <div style={{ fontFamily: 'var(--font-title)', fontSize: '0.85rem', fontWeight: 700, color: '#1E1B4B', lineHeight: 1.1 }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: rarity.color, fontWeight: 700, marginTop: 2 }}>
                        {rarity.label}
                      </div>
                    </div>
                    {card.owned_count > 1 && (
                      <div style={{ position: 'absolute', top: 6, right: 6, background: rarity.color, color: 'white', borderRadius: 999, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800 }}>
                        ×{card.owned_count}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                    <div style={{ fontSize: 40 }}>❓</div>
                    <div style={{ fontSize: '0.8rem', marginTop: 6, fontWeight: 600 }}>Не открыта</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ════ Оверлей открытия пакета ════ */}
      {(phase === 'shaking' || phase === 'revealing') && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(30,27,75,0.92)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
          onClick={phase === 'revealing' ? closeReveal : undefined}
        >
          {phase === 'shaking' && (
            <div style={{ textAlign: 'center' }}>
              <div className="animate-wiggle" style={{
                width: 200, fontSize: 0,
                animation: 'wiggle 0.25s ease-in-out infinite',
              }}>
                <img src="/cards/pack-letter-a.jpg" alt="Набор"
                  style={{ width: 200, borderRadius: 16, boxShadow: '0 0 40px rgba(255,217,61,0.6)' }} />
              </div>
              <p style={{ color: 'white', marginTop: 20, fontFamily: 'var(--font-title)', fontSize: '1.2rem' }}>
                Открываем... ✨
              </p>
            </div>
          )}

          {phase === 'revealing' && revealed && (
            <div className="animate-pop" style={{ textAlign: 'center', maxWidth: 320 }}>
              {(() => {
                const rarity = RARITY[revealed.card.rarity] || RARITY.common;
                return (
                  <>
                    <div style={{
                      borderRadius: 20, overflow: 'hidden', display: 'inline-block',
                      border: `4px solid ${rarity.color}`,
                      boxShadow: `0 0 60px ${rarity.glow}`,
                      animation: 'starPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                    }}>
                      <img src={revealed.card.image} alt={revealed.card.title}
                        style={{ width: 240, display: 'block' }} />
                    </div>
                    <div style={{ marginTop: 16, color: rarity.color, fontWeight: 800, fontSize: '0.95rem' }}>
                      {rarity.label}
                    </div>
                    <h2 style={{ color: 'white', fontFamily: 'var(--font-title)', marginTop: 4 }}>
                      {revealed.card.title}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginTop: 6 }}>
                      {revealed.isNew ? '🎉 Новая карточка в коллекции!' : `У тебя уже есть — теперь ×${revealed.count}`}
                    </p>
                    <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={closeReveal}>
                      Здорово!
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
