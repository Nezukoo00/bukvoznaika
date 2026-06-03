import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { NUMBERS_DATA, LENYA_MESSAGES } from '../../utils/content';
import { lessonsAPI } from '../../utils/api';
import { ProgressBar, Stars } from '../../components/shared/Stars';
import Lenya from '../../components/shared/Lenya';

// Генерация вариантов ответов для конкретного числа
function makeOptions(correct, total = 20) {
  const pool = Array.from({ length: total }, (_, i) => i + 1);
  const wrong = pool.filter(x => x !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
  return [correct, ...wrong].sort(() => Math.random() - 0.5);
}

// ════════════════════════════════════
//  КАРТА ЧИСЕЛ
// ════════════════════════════════════
export function NumbersMapPage() {
  const { activeChild } = useApp();
  const [progressByIndex, setProgressByIndex] = useState(new Array(20).fill(null));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    try {
      const lessons = await lessonsAPI.list('numbers', activeChild.id);
      const arr = new Array(20).fill(null);
      lessons.forEach(l => {
        const idx = l.order_index - 1;
        if (idx >= 0 && idx < 20) arr[idx] = l;
      });
      setProgressByIndex(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completed = progressByIndex.filter(p => p?.status === 'completed').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, animation: 'bounce 1s infinite' }}>🔢</div>
        <p style={{ color: '#6B7280', marginTop: 12 }}>Загружаем уроки...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3FF', paddingBottom: 32 }}>
      <div style={{
        background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
        padding: '20px 20px 28px', borderRadius: '0 0 28px 28px',
      }}>
        <button onClick={() => navigate('/learn')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'white', cursor: 'pointer', marginBottom: 14, fontFamily: 'var(--font-main)', fontWeight: 600 }}>
          ‹ Назад
        </button>
        <h2 style={{ color: 'white', fontFamily: 'var(--font-title)', marginBottom: 4 }}>🔢 Числа</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: 12 }}>
          Выучено: {completed} из 20
        </p>
        <ProgressBar value={completed} max={20} color="rgba(255,255,255,0.9)" height={10} />
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {NUMBERS_DATA.map((numData, idx) => {
            const prog = progressByIndex[idx];
            const status = prog?.status || 'not_started';
            const isLocked = idx > 0 && progressByIndex[idx - 1]?.status !== 'completed';
            return (
              <button key={numData.number}
                onClick={() => !isLocked && navigate(`/learn/numbers/${idx}`)}
                style={{
                  aspectRatio: '1',
                  background: status === 'completed' ? numData.color
                    : status === 'in_progress' ? `${numData.color}55`
                    : isLocked ? '#F3F4F6' : 'white',
                  border: `3px solid ${status === 'completed' ? numData.color : '#E5E7EB'}`,
                  borderRadius: 18, cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-title)', transition: 'all 0.2s', position: 'relative',
                  boxShadow: status === 'completed' ? `0 4px 0 ${numData.color}66` : 'none',
                }}>
                {isLocked && <div style={{ position: 'absolute', top: 2, right: 4, fontSize: 10 }}>🔒</div>}
                {status === 'completed' && (
                  <div style={{ position: 'absolute', top: -6, right: -6, fontSize: 13, background: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>✅</div>
                )}
                <span style={{ fontSize: 28, fontWeight: 900, color: status === 'completed' ? 'white' : isLocked ? '#D1D5DB' : '#1E1B4B' }}>
                  {numData.number}
                </span>
                <span style={{ fontSize: 16, filter: isLocked ? 'grayscale(1)' : 'none' }}>{numData.emoji}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ color: '#22C55E', label: 'Выучено' }, { color: '#A855F7', label: 'В процессе' }, { color: '#E5E7EB', label: 'Не начато' }].map(item => (
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

// ════════════════════════════════════
//  УРОК ПО ЧИСЛУ
// ════════════════════════════════════
export function NumberLessonPage() {
  const { index } = useParams();
  const numIdx = parseInt(index, 10);
  const navigate = useNavigate();

  if (isNaN(numIdx) || numIdx < 0 || numIdx > 19) {
    navigate('/learn/numbers');
    return null;
  }

  const numData = NUMBERS_DATA[numIdx];
  const { activeChild, addSessionStar, addSessionLesson } = useApp();

  // Шаги: 0=intro, 1=counting, 2=recognition, 3=math (если есть), 4=complete
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [stars, setStars] = useState(0);
  const [lenyaMsg, setLenyaMsg] = useState('');
  const [lessonId, setLessonId] = useState(null);

  // Генерируем варианты ответов один раз для данного числа
  const countingOptions  = useMemo(() => makeOptions(numData.number), [numIdx]);
  const recognitionOptions = useMemo(() => makeOptions(numData.number), [numIdx]);

  // Математический пример (только для чисел 3–20)
  const mathEx = useMemo(() => {
    const n = numData.number;
    if (n < 3) return null;
    if (n <= 10) {
      const a = Math.floor(Math.random() * (n - 1)) + 1;
      return { a, b: n - a, result: n, type: 'add' };
    }
    const sub = Math.floor(Math.random() * 4) + 1;
    return { a: n, b: sub, result: n - sub, type: 'sub' };
  }, [numIdx]);

  const mathOptions = useMemo(() => {
    if (!mathEx) return [];
    return makeOptions(mathEx.result, 20);
  }, [numIdx]);

  // Считаем сколько всего шагов: intro + counting + recognition + (math?) + complete
  // step 1 = counting, step 2 = recognition, step 3 = math (если есть), step 4 = complete
  const completeStep = mathEx ? 4 : 3;

  useEffect(() => {
    setStep(0);
    setAnswer(null);
    setStars(0);
    setLessonId(null);
    setLenyaMsg(LENYA_MESSAGES.start[0]);
    fetchLessonId();
  }, [numIdx]);

  const fetchLessonId = async () => {
    try {
      const lessons = await lessonsAPI.list('numbers', activeChild.id);
      const lesson = lessons.find(l => l.order_index === numIdx + 1);
      if (lesson) {
        setLessonId(lesson.id);
        await lessonsAPI.saveProgress(lesson.id, activeChild.id, 'in_progress', 0);
      } else {
        console.error('Урок числа не найден, order_index =', numIdx + 1);
      }
    } catch (err) {
      console.error('fetchLessonId numbers error:', err);
    }
  };

  const handleAnswer = (opt, correct) => {
    if (answer !== null) return;
    setAnswer(opt);
    const isCorrect = opt === correct;
    if (isCorrect) {
      setStars(s => s + 1);
      addSessionStar(1);
      setLenyaMsg(LENYA_MESSAGES.correct[Math.floor(Math.random() * LENYA_MESSAGES.correct.length)]);
    } else {
      setLenyaMsg(LENYA_MESSAGES.wrong[0]);
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
        const lessons = await lessonsAPI.list('numbers', activeChild.id);
        const lesson = lessons.find(l => l.order_index === numIdx + 1);
        if (lesson) await lessonsAPI.saveProgress(lesson.id, activeChild.id, 'completed', finalStars);
      }
    } catch (err) {
      console.error('handleComplete numbers error:', err);
    }
    navigate('/learn/numbers');
  };

  const optionBtn = (opt, correct) => {
    let bg = 'white', border = '#E5E7EB';
    if (answer !== null) {
      if (opt === correct)  { bg = '#DCFCE7'; border = '#22C55E'; }
      else if (opt === answer) { bg = '#FEE2E2'; border = '#EF4444'; }
    }
    return { bg, border };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3FF', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: numData.color, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/learn/numbers')}
          style={{ background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-main)' }}>
          ‹ Назад
        </button>
        <div style={{ color: 'white', fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1.1rem' }}>
          Число {numData.number}
        </div>
        <Stars count={stars} max={mathEx ? 3 : 2} size={22} animate />
      </div>

      <div style={{ flex: 1, padding: '20px 16px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Lenya size="sm" message={lenyaMsg} />
        </div>

        {/* ── ШАГ 0: Знакомство ── */}
        {step === 0 && (
          <div className="animate-fadein" style={{ textAlign: 'center' }}>
            <div style={{ width: 160, height: 160, borderRadius: 32, background: numData.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 8px 0 ${numData.color}88` }}>
              <span style={{ fontSize: 90, fontFamily: 'var(--font-title)', fontWeight: 900, color: 'white' }}>{numData.number}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', marginBottom: 4 }}>{numData.name}</h2>
            <div style={{ fontSize: 56, margin: '12px 0' }}>{numData.emoji}</div>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4, margin: '12px auto 24px', maxWidth: 280 }}>
              {Array(numData.number).fill(null).map((_, i) => (
                <span key={i} className="animate-pop" style={{ fontSize: 26, animationDelay: `${i * 0.04}s` }}>{numData.emoji}</span>
              ))}
            </div>
            <button className="btn btn-secondary btn-lg btn-block" onClick={() => setStep(1)}>🚀 Начать!</button>
          </div>
        )}

        {/* ── ШАГ 1: Посчитай предметы ── */}
        {step === 1 && (
          <div className="animate-fadein">
            <h3 style={{ textAlign: 'center', marginBottom: 16, fontFamily: 'var(--font-title)' }}>
              Сколько предметов?
            </h3>
            <div style={{ background: '#F3F4F6', borderRadius: 20, padding: '16px', minHeight: 80, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16, alignItems: 'center' }}>
              {Array(numData.number).fill(numData.emoji).map((item, i) => (
                <span key={i} style={{ fontSize: 28 }}>{item}</span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {countingOptions.map(opt => {
                const s = optionBtn(opt, numData.number);
                return (
                  <button key={opt} onClick={() => handleAnswer(opt, numData.number)}
                    style={{ padding: '22px', border: `3px solid ${s.border}`, background: s.bg, borderRadius: 18, cursor: answer !== null ? 'default' : 'pointer', fontFamily: 'var(--font-title)', fontSize: '2.5rem', fontWeight: 900, transition: 'all 0.15s', boxShadow: answer === null ? '0 4px 0 #E5E7EB' : 'none' }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ШАГ 2: Покажи число ── */}
        {step === 2 && (
          <div className="animate-fadein">
            <h3 style={{ textAlign: 'center', marginBottom: 20, fontFamily: 'var(--font-title)' }}>
              Покажи число {numData.number}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {recognitionOptions.map(opt => {
                const s = optionBtn(opt, numData.number);
                return (
                  <button key={opt} onClick={() => handleAnswer(opt, numData.number)}
                    style={{ padding: '28px 16px', background: s.bg, border: `3px solid ${s.border}`, borderRadius: 20, cursor: answer !== null ? 'default' : 'pointer', fontFamily: 'var(--font-title)', fontSize: '3.5rem', fontWeight: 900, transition: 'all 0.2s', boxShadow: answer === null ? '0 4px 0 #E5E7EB' : 'none' }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ШАГ 3: Арифметика (если есть) ── */}
        {step === 3 && mathEx && (
          <div className="animate-fadein" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-title)' }}>Реши пример! 🧮</h3>
            <div style={{ fontSize: '3rem', fontFamily: 'var(--font-title)', fontWeight: 900, marginBottom: 24, color: numData.color }}>
              {mathEx.a} {mathEx.type === 'add' ? '+' : '−'} {mathEx.b} = ?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {mathOptions.map(opt => {
                const s = optionBtn(opt, mathEx.result);
                return (
                  <button key={opt} onClick={() => handleAnswer(opt, mathEx.result)}
                    style={{ padding: '24px', background: s.bg, border: `3px solid ${s.border}`, borderRadius: 20, cursor: answer !== null ? 'default' : 'pointer', fontFamily: 'var(--font-title)', fontSize: '3rem', fontWeight: 900, transition: 'all 0.2s', boxShadow: answer === null ? '0 4px 0 #E5E7EB' : 'none' }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ЗАВЕРШЕНИЕ ── */}
        {step === completeStep && (
          <div className="animate-pop" style={{ textAlign: 'center', marginTop: 20 }}>
            <div style={{ fontSize: 80 }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-title)', marginBottom: 8 }}>Молодец!</h2>
            <p style={{ color: '#6B7280', marginBottom: 16 }}>
              Ты выучил число {numData.number} — {numData.name}!
            </p>
            <Stars count={Math.min(mathEx ? 3 : 2, stars)} max={mathEx ? 3 : 2} size={36} animate />
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              {numIdx < 19 && (
                <button className="btn btn-secondary" style={{ flex: 1 }}
                  onClick={() => navigate(`/learn/numbers/${numIdx + 1}`)}>
                  Следующее →
                </button>
              )}
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleComplete}>
                🏠 К числам
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
