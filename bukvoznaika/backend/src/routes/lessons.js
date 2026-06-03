const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/lessons?type=alphabet|numbers&childId=...
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, childId } = req.query;
    let query = `
      SELECT l.*, lc.name as category_name,
        clp.status, clp.stars_earned, clp.attempts, clp.completed_at
      FROM lessons l
      JOIN lesson_categories lc ON lc.id = l.category_id
      LEFT JOIN child_lesson_progress clp ON clp.lesson_id = l.id AND clp.child_id = $1
      WHERE 1=1
    `;
    const params = [childId];
    if (type) {
      query += ` AND l.type = $${params.length + 1}`;
      params.push(type);
    }
    query += ' ORDER BY l.order_index';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/lessons/:id/exercises
router.get('/:id/exercises', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM exercises WHERE lesson_id = $1 ORDER BY order_index',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/lessons/:id/progress - обновить прогресс урока
router.post('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { childId, status, starsEarned } = req.body;
    const lessonId = req.params.id;

    // Проверяем, что ребёнок принадлежит родителю
    const childCheck = await pool.query(
      'SELECT id FROM children WHERE id = $1 AND parent_id = $2',
      [childId, req.user.parentId]
    );
    if (!childCheck.rows[0]) return res.status(403).json({ error: 'Доступ запрещён' });

    // Проверяем текущий прогресс, чтобы не откатить completed -> in_progress
    const existing = await pool.query(
      'SELECT status, stars_earned FROM child_lesson_progress WHERE child_id = $1 AND lesson_id = $2',
      [childId, lessonId]
    );
    const wasCompleted = existing.rows[0]?.status === 'completed';
    const prevStars = existing.rows[0]?.stars_earned || 0;

    // Статус не понижается: если уже completed — не меняем на in_progress
    const effectiveStatus = wasCompleted ? 'completed' : status;
    // Звёзды — берём максимум между предыдущим и текущим
    const effectiveStars = Math.max(prevStars, starsEarned || 0);

    const { rows } = await pool.query(`
      INSERT INTO child_lesson_progress
        (child_id, lesson_id, status, stars_earned, attempts, last_attempt_at, completed_at)
      VALUES
        ($1::uuid, $2::integer, $3::varchar, $4::integer, 1, NOW(),
         CASE WHEN $3::varchar = 'completed' THEN NOW() ELSE NULL END)
      ON CONFLICT (child_id, lesson_id) DO UPDATE SET
        status       = $3::varchar,
        stars_earned = $4::integer,
        attempts     = child_lesson_progress.attempts + 1,
        last_attempt_at = NOW(),
        completed_at = CASE
          WHEN $3::varchar = 'completed' AND child_lesson_progress.completed_at IS NULL
            THEN NOW()
          ELSE child_lesson_progress.completed_at
        END
      RETURNING *
    `, [childId, lessonId, effectiveStatus, effectiveStars]);

    // Добавляем звёзды ребёнку только при первом завершении урока
    if (status === 'completed' && !wasCompleted && starsEarned > 0) {
      await pool.query(
        'UPDATE children SET total_stars = total_stars + $1, updated_at = NOW() WHERE id = $2',
        [starsEarned, childId]
      );
    }

    // Проверяем и выдаём достижения
    await checkAndGrantAchievements(childId);

    res.json(rows[0]);
  } catch (err) {
    console.error('Progress save error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/lessons/session/start
router.post('/session/start', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.body;
    const childCheck = await pool.query(
      'SELECT id FROM children WHERE id = $1 AND parent_id = $2',
      [childId, req.user.parentId]
    );
    if (!childCheck.rows[0]) return res.status(403).json({ error: 'Доступ запрещён' });

    const { rows } = await pool.query(
      'INSERT INTO learning_sessions (child_id) VALUES ($1) RETURNING id',
      [childId]
    );
    res.json({ sessionId: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/lessons/session/end
router.post('/session/end', authMiddleware, async (req, res) => {
  try {
    const { sessionId, childId, durationSeconds, lessonsCompleted, starsEarned, exercisesCompleted } = req.body;

    await pool.query(`
      UPDATE learning_sessions
      SET ended_at = NOW(),
          duration_seconds   = $1,
          lessons_completed  = $2,
          stars_earned       = $3,
          exercises_completed = $4
      WHERE id = $5
    `, [durationSeconds, lessonsCompleted, starsEarned, exercisesCompleted, sessionId]);

    // Обновляем дневное время использования
    const minutes = Math.ceil((durationSeconds || 0) / 60);
    await pool.query(`
      INSERT INTO daily_usage (child_id, date, total_minutes)
      VALUES ($1, CURRENT_DATE, $2)
      ON CONFLICT (child_id, date)
      DO UPDATE SET total_minutes = daily_usage.total_minutes + EXCLUDED.total_minutes
    `, [childId, minutes]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка и выдача достижений
async function checkAndGrantAchievements(childId) {
  try {
    const child = await pool.query('SELECT total_stars FROM children WHERE id = $1', [childId]);
    const stars = child.rows[0]?.total_stars || 0;

    const completedResult = await pool.query(
      "SELECT COUNT(*) FROM child_lesson_progress WHERE child_id = $1 AND status = 'completed'",
      [childId]
    );
    const totalLessons = parseInt(completedResult.rows[0].count);

    const alphaResult = await pool.query(`
      SELECT COUNT(*) FROM child_lesson_progress clp
      JOIN lessons l ON l.id = clp.lesson_id
      WHERE clp.child_id = $1 AND clp.status = 'completed' AND l.type = 'alphabet'
    `, [childId]);
    const alphaCompleted = parseInt(alphaResult.rows[0].count);

    const numResult = await pool.query(`
      SELECT COUNT(*) FROM child_lesson_progress clp
      JOIN lessons l ON l.id = clp.lesson_id
      WHERE clp.child_id = $1 AND clp.status = 'completed' AND l.type = 'numbers'
    `, [childId]);
    const numsCompleted = parseInt(numResult.rows[0].count);

    const allAchievements = await pool.query('SELECT * FROM achievements');

    for (const ach of allAchievements.rows) {
      // Пропускаем уже выданные
      const alreadyHas = await pool.query(
        'SELECT id FROM child_achievements WHERE child_id = $1 AND achievement_id = $2',
        [childId, ach.id]
      );
      if (alreadyHas.rows.length > 0) continue;

      let earned = false;
      if (ach.key === 'first_star'      && stars >= 1)             earned = true;
      if (ach.key === 'five_stars'      && stars >= 5)             earned = true;
      if (ach.key === 'fifty_stars'     && stars >= 50)            earned = true;
      if (ach.key === 'hundred_stars'   && stars >= 100)           earned = true;
      if (ach.key === 'ten_lessons'     && totalLessons >= 10)     earned = true;
      if (ach.key === 'alphabet_master' && alphaCompleted >= 33)   earned = true;
      if (ach.key === 'number_master'   && numsCompleted >= 20)    earned = true;

      if (earned) {
        await pool.query(
          'INSERT INTO child_achievements (child_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [childId, ach.id]
        );
      }
    }
  } catch (err) {
    console.error('Achievement check error:', err);
  }
}

module.exports = router;
