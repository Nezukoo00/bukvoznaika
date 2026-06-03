import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { ALPHABET_DATA, LENYA_MESSAGES } from '../../utils/content';
import { Stars } from '../../components/shared/Stars';
import Lenya from '../../components/shared/Lenya';
import { lessonsAPI } from '../../utils/api';

// Генерируем упражнения прямо здесь, чтобы гарантировать использование правильной буквы
function makeExercises(letterData) {
  const others = ALPHABET_DATA.filter(l => l.letter !== letterData.letter);
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

  // Упражнение 1: найди букву среди 4 вариантов
  const wrongLetters = shuffle(others).slice(0, 3).map(l => l.letter);
  const letterOptions = shuffle([letterData.letter, ...wrongLetters]);

  // Упражнение 2: найди слово по букве
  const wrongWords = shuffle(others).slice(0, 3).map(l => ({ word: l.word, emoji: l.emoji }));
  const wordOptions = shuffle([{ word: letterData.word, emoji: letterData.emoji }, ...wrongWords]);

  return [
    { type: 'recognition', question: `Найди букву ${letterData.letter}!`, options: letterOptions, correct: letterData.letter },
    { type: 'matching',    question: `Какое слово начинается на ${letterData.letter}?`, options: wordOptions, correct: letterData.word },
  ];
}

export default function LetterLessonPage() {
  const { index } = useParams();
  // Явно парсим индекс и проверяем что он число
  const letterIdx = parseInt(index, 10);

  // Если индекс невалидный — редирект
  const navigate = useNavigate();
  if (isNaN(letterIdx) || letterIdx < 0 || letterIdx > 32) {
    navigate('/learn/alphabet');
    return null;
  }

  const letterData = ALPHABET_DATA[letterIdx];
  const { activeChild, addSessionStar, addSessionLesson } = useApp();

  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [stars, setStars] = useState(0);
  const [lenyaMsg, setLenyaMsg] = useState('');
  const [lessonId, setLessonId] = useState(null);

  // Canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Упражнения генерируются для КОНКРЕТНОЙ буквы по индексу
  // useMemo с ключом letterIdx гарантирует пересчёт при смене буквы
  const exercises = useMemo(() => makeExercises(letterData), [letterIdx]);

  useEffect(() => {
    // Сбрасываем всё при смене буквы
    setStep(0);
    setAnswer(null);
    setStars(0);
    setHasDrawn(false);
    setLessonId(null);
    setLenyaMsg(LENYA_MESSAGES.start[Math.floor(Math.random() * LENYA_MESSAGES.start.length)]);
    fetchLessonId();
    // Очищаем canvas если он уже был нарисован
    if (canvasRef.current) {
      canvasRef.current.getContext('2d').clearRect(0, 0, 280, 240);
    }
  }, [letterIdx]);

  const fetchLessonId = async () => {
    try {
      const lessons = await lessonsAPI.list('alphabet', activeChild.id);
      const lesson = lessons.find(l => l.order_index === letterIdx + 1);
      if (lesson) {
        setLessonId(lesson.id);
        await lessonsAPI.saveProgress(lesson.id, activeChild.id, 'in_progress', 0);
      } else {
        console.error('Урок не найден, order_index =', letterIdx + 1, '| Все уроки:', lessons.map(l => l.order_index));
      }
    } catch (err) {
      console.error('fetchLessonId error:', err);
    }
  };

  const handleAnswer = (option, exercise) => {
    if (answer !== null) return;
    setAnswer(option);
    const correct = option === exercise.correct;
    if (correct) {
      setStars(s => s + 1);
      addSessionStar(1);
      setLenyaMsg(LENYA_MESSAGES.correct[Math.floor(Math.random() * LENYA_MESSAGES.correct.length)]);
    } else {
      setLenyaMsg(LENYA_MESSAGES.wrong[Math.floor(Math.random() * LENYA_MESSAGES.wrong.length)]);
    }
    setTimeout(() => {
      setAnswer(null);
      setStep(s => s + 1);
    }, 1400);
  };

  const handleComplete = async () => {
    const finalStars = Math.min(3, stars);
    addSessionLesson();
    try {
      if (lessonId) {
        await lessonsAPI.saveProgress(lessonId, activeChild.id, 'completed', finalStars);
      } else {
        // Запасной путь
        const lessons = await lessonsAPI.list('alphabet', activeChild.id);
        const lesson = lessons.find(l => l.order_index === letterIdx + 1);
        if (lesson) await lessonsAPI.saveProgress(lesson.id, activeChild.id, 'completed', finalStars);
      }
    } catch (err) {
      console.error('handleComplete error:', err);
    }
    navigate('/learn/alphabet');
  };

  // Canvas helpers
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };
  const startDraw = e => {
    setIsDrawing(true); setHasDrawn(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = e => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = letterData.color;
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => {
    canvasRef.current.getContext('2d').clearRect(0, 0, 280, 240);
    setHasDrawn(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFF9F0', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: letterData.color, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/learn/alphabet')}
          style={{ background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-main)' }}>
          ‹ Назад
        </button>
        <div style={{ color: 'white', fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1.1rem' }}>
          Буква {letterData.letter}
        </div>
        <Stars count={stars} max={3} size={22} animate />
      </div>

      <div style={{ flex: 1, padding: '20px 16px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Lenya size="sm" message={lenyaMsg} />
        </div>

        {/* ── ШАГ 0: Знакомство с буквой ── */}
        {step === 0 && (
          <div className="animate-fadein" style={{ textAlign: 'center' }}>
            <div style={{
              width: 160, height: 160, borderRadius: 32,
              background: letterData.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: `0 8px 0 ${letterData.color}88`,
            }}>
              <span style={{ fontSize: 100, fontFamily: 'var(--font-title)', color: 'white', fontWeight: 900 }}>
                {letterData.letter}
              </span>
            </div>
            <h2 style={{ marginBottom: 8, fontFamily: 'var(--font-title)', fontSize: '2rem' }}>
              Буква {letterData.letter}
            </h2>
            <div style={{ fontSize: 64, margin: '12px 0' }}>{letterData.emoji}</div>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              {letterData.sound}
            </p>
            <p style={{ color: '#6B7280', marginBottom: 24 }}>
              Слово: <strong>{letterData.word}</strong>
            </p>
            <button className="btn btn-secondary btn-lg btn-block" onClick={() => setStep(1)}>
              🚀 Начать упражнения!
            </button>
          </div>
        )}

        {/* ── ШАГ 1: Найди букву ── */}
        {step === 1 && (
          <div className="animate-fadein">
            <h3 style={{ textAlign: 'center', marginBottom: 20, fontFamily: 'var(--font-title)' }}>
              {exercises[0].question}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {exercises[0].options.map(opt => {
                let bg = 'white', border = '#E5E7EB', color = '#1E1B4B';
                if (answer !== null) {
                  if (opt === exercises[0].correct) { bg = '#DCFCE7'; border = '#22C55E'; color = '#166534'; }
                  else if (opt === answer)           { bg = '#FEE2E2'; border = '#EF4444'; color = '#991B1B'; }
                }
                return (
                  <button key={opt} onClick={() => handleAnswer(opt, exercises[0])}
                    style={{
                      padding: '28px 16px', background: bg,
                      border: `3px solid ${border}`, borderRadius: 20,
                      cursor: answer !== null ? 'default' : 'pointer',
                      fontFamily: 'var(--font-title)', fontSize: '3.5rem', fontWeight: 900,
                      color, transition: 'all 0.2s',
                      boxShadow: answer === null ? '0 4px 0 #E5E7EB' : 'none',
                    }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ШАГ 2: Найди слово ── */}
        {step === 2 && (
          <div className="animate-fadein">
            <h3 style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'var(--font-title)' }}>
              {exercises[1].question}
            </h3>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 72, fontFamily: 'var(--font-title)', fontWeight: 900, color: letterData.color }}>
                {letterData.letter}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {exercises[1].options.map(opt => {
                let bg = 'white', border = '#E5E7EB';
                if (answer !== null) {
                  if (opt.word === exercises[1].correct) { bg = '#DCFCE7'; border = '#22C55E'; }
                  else if (opt.word === answer)           { bg = '#FEE2E2'; border = '#EF4444'; }
                }
                return (
                  <button key={opt.word} onClick={() => handleAnswer(opt.word, exercises[1])}
                    style={{
                      padding: '18px 12px', background: bg,
                      border: `3px solid ${border}`, borderRadius: 20,
                      cursor: answer !== null ? 'default' : 'pointer',
                      textAlign: 'center', transition: 'all 0.2s',
                      boxShadow: answer === null ? '0 4px 0 #E5E7EB' : 'none',
                    }}>
                    <div style={{ fontSize: 40 }}>{opt.emoji}</div>
                    <div style={{ fontFamily: 'var(--font-title)', fontSize: '1rem', fontWeight: 700, marginTop: 6 }}>
                      {opt.word}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ШАГ 3: Обводка ── */}
        {step === 3 && (
          <div className="animate-fadein" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-title)' }}>
              Обведи букву {letterData.letter}!
            </h3>
            <div style={{ position: 'relative', display: 'inline-block', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 160, fontFamily: 'var(--font-title)', fontWeight: 900,
                color: `${letterData.color}22`, userSelect: 'none', pointerEvents: 'none',
              }}>
                {letterData.letter}
              </div>
              <canvas ref={canvasRef} width={280} height={240}
                style={{
                  border: `3px dashed ${letterData.color}`, borderRadius: 20,
                  touchAction: 'none', background: 'white',
                  cursor: 'crosshair', display: 'block',
                }}
                onMouseDown={startDraw} onMouseMove={draw}
                onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={clearCanvas}>
                🗑️ Очистить
              </button>
              {hasDrawn && (
                <button className="btn btn-success" style={{ flex: 2 }}
                  onClick={() => { setStars(s => Math.min(3, s + 1)); setStep(4); }}>
                  ✅ Готово!
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── ШАГ 4: Завершение ── */}
        {step === 4 && (
          <div className="animate-pop" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 80, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-title)', marginBottom: 8 }}>Отлично!</h2>
            <p style={{ color: '#6B7280', marginBottom: 20 }}>
              Ты выучил букву {letterData.letter}!
            </p>
            <Stars count={Math.min(3, stars)} max={3} size={36} animate />
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              {letterIdx < 32 && (
                <button className="btn btn-secondary" style={{ flex: 1 }}
                  onClick={() => navigate(`/learn/alphabet/${letterIdx + 1}`)}>
                  Следующая →
                </button>
              )}
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleComplete}>
                🏠 К алфавиту
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
