import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { ALPHABET_DATA, NUMBERS_DATA } from '../../utils/content';
import Lenya from '../../components/shared/Lenya';

// ---- Игра 1: Найди пару ----
function MatchingGame({ onComplete }) {
  const items = ALPHABET_DATA.slice(0, 6).map(l => ({ letter: l.letter, emoji: l.emoji, word: l.word }));
  const [cards, setCards] = useState(() => {
    const pairs = items.flatMap(i => [
      { id: `l-${i.letter}`, type: 'letter', value: i.letter, pairKey: i.letter },
      { id: `e-${i.letter}`, type: 'emoji', value: i.emoji, word: i.word, pairKey: i.letter },
    ]);
    return pairs.sort(() => Math.random() - 0.5).map(c => ({ ...c, matched: false, flipped: false }));
  });
  const [selected, setSelected] = useState([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const flip = (idx) => {
    if (cards[idx].matched || cards[idx].flipped || selected.length === 2) return;
    const newCards = [...cards];
    newCards[idx] = { ...newCards[idx], flipped: true };
    const newSelected = [...selected, idx];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setAttempts(a => a + 1);
      const [a, b] = newSelected;
      if (newCards[a].pairKey === newCards[b].pairKey) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => newSelected.includes(i) ? { ...c, matched: true } : c));
          setSelected([]);
          setMatches(m => {
            if (m + 1 === 6) onComplete(Math.max(1, 3 - Math.floor(attempts / 6)));
            return m + 1;
          });
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => newSelected.includes(i) ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 900);
      }
    }
  };

  return (
    <div>
      <h3 style={{ textAlign: 'center', marginBottom: 6, fontFamily: 'var(--font-title)' }}>🃏 Найди пару!</h3>
      <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.9rem', marginBottom: 16 }}>
        Совпадений: {matches}/6 · Попыток: {attempts}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {cards.map((card, idx) => (
          <button key={card.id} onClick={() => flip(idx)}
            style={{
              aspectRatio: '1', borderRadius: 14, border: 'none', cursor: card.matched ? 'default' : 'pointer',
              background: card.matched ? '#DCFCE7' : card.flipped ? 'white' : '#A855F7',
              fontSize: card.type === 'letter' ? '1.8rem' : '2rem',
              fontFamily: 'var(--font-title)', fontWeight: 900,
              color: card.matched ? '#166534' : card.flipped ? '#1E1B4B' : '#A855F7',
              transition: 'all 0.2s',
              boxShadow: card.matched ? 'none' : card.flipped ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 0 #6D28D9',
              transform: card.matched ? 'scale(0.95)' : 'scale(1)',
            }}>
            {card.matched || card.flipped ? (card.type === 'letter' ? card.value : card.value) : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Игра 2: Быстрый счёт ----
function QuickCountGame({ onComplete }) {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [current, setCurrent] = useState(null);
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState(null);
  const total = 8;

  const genRound = useCallback(() => {
    const n = Math.floor(Math.random() * 10) + 1;
    const emoji = NUMBERS_DATA[n - 1].emoji;
    const items = Array(n).fill(emoji);
    const wrong = [Math.max(1, n - 2), Math.max(1, n - 1), n + 1, n + 2].filter(x => x !== n);
    const opts = [n, ...wrong.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
    setCurrent({ n, items });
    setOptions(opts);
    setFeedback(null);
  }, []);

  useEffect(() => { genRound(); }, []);
  useEffect(() => {
    if (timeLeft <= 0) { onComplete(score >= 6 ? 3 : score >= 4 ? 2 : 1); return; }
    if (round >= total) { onComplete(score >= 6 ? 3 : score >= 4 ? 2 : 1); return; }
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, round]);

  const answer = (opt) => {
    if (feedback) return;
    const correct = opt === current.n;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);
    setTimeout(() => { setRound(r => r + 1); genRound(); }, 700);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, color: '#A855F7' }}>⭐ {score}/{total}</span>
        <span style={{ fontWeight: 700, color: timeLeft < 10 ? '#EF4444' : '#6B7280' }}>⏱️ {timeLeft}с</span>
      </div>
      <div style={{ background: '#F3F4F6', borderRadius: 20, padding: '16px', minHeight: 80, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16, alignItems: 'center' }}>
        {current?.items.map((item, i) => <span key={i} style={{ fontSize: 28 }}>{item}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {options.map(opt => (
          <button key={opt} onClick={() => answer(opt)}
            style={{
              padding: '22px', border: '3px solid',
              borderColor: feedback && opt === current?.n ? '#22C55E' : feedback && opt !== current?.n ? '#EF4444' : '#E5E7EB',
              background: feedback && opt === current?.n ? '#DCFCE7' : feedback && opt !== current?.n ? '#FEE2E2' : 'white',
              borderRadius: 18, cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: '2.5rem', fontWeight: 900,
              transition: 'all 0.15s',
            }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Main Games Page ----
const GAMES = [
  { id: 'matching', title: 'Найди пару', emoji: '🃏', desc: 'Сопоставь буквы со словами', color: '#FF6B9D', component: MatchingGame },
  { id: 'counting', title: 'Быстрый счёт', emoji: '⚡', desc: 'Считай как можно быстрее!', color: '#A855F7', component: QuickCountGame },
];

export default function GamesPage() {
  const navigate = useNavigate();
  const { addSessionStar } = useApp();
  const [activeGame, setActiveGame] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  const handleGameComplete = (stars) => {
    addSessionStar(stars);
    setGameResult(stars);
  };

  if (activeGame && !gameResult) {
    const GameComponent = GAMES.find(g => g.id === activeGame).component;
    return (
      <div style={{ minHeight: '100vh', background: '#FFF9F0', padding: 16, paddingTop: 24, maxWidth: 480, margin: '0 auto' }}>
        <button onClick={() => setActiveGame(null)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '0.9rem', marginBottom: 16, fontFamily: 'var(--font-main)', fontWeight: 600 }}>
          ‹ К играм
        </button>
        <GameComponent onComplete={handleGameComplete} />
      </div>
    );
  }

  if (gameResult) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFF9F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="animate-pop" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80 }}>🎊</div>
          <h2 style={{ fontFamily: 'var(--font-title)', marginBottom: 8 }}>Молодец!</h2>
          <div style={{ fontSize: '2rem', margin: '12px 0' }}>{'⭐'.repeat(gameResult)}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => { setGameResult(null); }}>Ещё раз</button>
            <button className="btn btn-secondary" onClick={() => { setActiveGame(null); setGameResult(null); }}>К играм</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFF9F0' }}>
      <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', padding: '20px 20px 28px', borderRadius: '0 0 28px 28px' }}>
        <button onClick={() => navigate('/learn')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'white', cursor: 'pointer', marginBottom: 14, fontFamily: 'var(--font-main)', fontWeight: 600 }}>‹ Назад</button>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-title)' }}>🎮 Мини-игры</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Учись играючи!</p>
      </div>
      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <Lenya size="sm" message="Поиграем? 🎮" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
          {GAMES.map((game, i) => (
            <button key={game.id} onClick={() => setActiveGame(game.id)}
              className="animate-fadein"
              style={{
                background: `linear-gradient(135deg, ${game.color} 0%, ${game.color}CC 100%)`,
                border: 'none', borderRadius: 24, padding: '22px', cursor: 'pointer', textAlign: 'left', color: 'white',
                boxShadow: `0 6px 0 ${game.color}88`, transition: 'all 0.15s',
                animationDelay: `${i * 0.1}s`, display: 'flex', alignItems: 'center', gap: 18,
              }}>
              <span style={{ fontSize: 52 }}>{game.emoji}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 800 }}>{game.title}</div>
                <div style={{ opacity: 0.85, fontSize: '0.9rem' }}>{game.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
