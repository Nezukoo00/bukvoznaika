const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/children - список детей родителя
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, 
        COUNT(DISTINCT clp.lesson_id) FILTER (WHERE clp.status = 'completed') AS completed_lessons,
        COALESCE(du.total_minutes, 0) AS today_minutes
       FROM children c
       LEFT JOIN child_lesson_progress clp ON clp.child_id = c.id
       LEFT JOIN daily_usage du ON du.child_id = c.id AND du.date = CURRENT_DATE
       WHERE c.parent_id = $1
       GROUP BY c.id, du.total_minutes
       ORDER BY c.created_at`,
      [req.user.parentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/children - создать профиль ребёнка
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, age, daily_limit_minutes } = req.body;
    if (!name) return res.status(400).json({ error: 'Введите имя ребёнка' });

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM children WHERE parent_id = $1',
      [req.user.parentId]
    );
    if (parseInt(countResult.rows[0].count) >= 3) {
      return res.status(400).json({ error: 'Максимум 3 профиля детей' });
    }

    const { rows } = await pool.query(
      `INSERT INTO children (parent_id, name, avatar, age, daily_limit_minutes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.parentId, name.trim(), avatar || 'bear', age || 6, daily_limit_minutes || 60]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/children/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, age, daily_limit_minutes } = req.body;
    const { rows } = await pool.query(
      `UPDATE children SET name = COALESCE($1, name), avatar = COALESCE($2, avatar),
       age = COALESCE($3, age), daily_limit_minutes = COALESCE($4, daily_limit_minutes),
       updated_at = NOW()
       WHERE id = $5 AND parent_id = $6 RETURNING *`,
      [name, avatar, age, daily_limit_minutes, req.params.id, req.user.parentId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Профиль не найден' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/children/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM children WHERE id = $1 AND parent_id = $2 RETURNING id',
      [req.params.id, req.user.parentId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Профиль не найден' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/children/:id/stats - детальная статистика
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const childCheck = await pool.query(
      'SELECT id FROM children WHERE id = $1 AND parent_id = $2',
      [req.params.id, req.user.parentId]
    );
    if (!childCheck.rows[0]) return res.status(404).json({ error: 'Профиль не найден' });

    const childId = req.params.id;

    const [child, progress, weeklyUsage, recentSessions, achievements] = await Promise.all([
      pool.query('SELECT * FROM children WHERE id = $1', [childId]),
      pool.query(`
        SELECT l.type, l.title, l.content_key, clp.status, clp.stars_earned, clp.completed_at
        FROM lessons l
        LEFT JOIN child_lesson_progress clp ON clp.lesson_id = l.id AND clp.child_id = $1
        ORDER BY l.type, l.order_index
      `, [childId]),
      pool.query(`
        SELECT date, total_minutes FROM daily_usage
        WHERE child_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY date
      `, [childId]),
      pool.query(`
        SELECT * FROM learning_sessions
        WHERE child_id = $1 ORDER BY started_at DESC LIMIT 10
      `, [childId]),
      pool.query(`
        SELECT a.*, ca.earned_at FROM achievements a
        JOIN child_achievements ca ON ca.achievement_id = a.id
        WHERE ca.child_id = $1
      `, [childId])
    ]);

    const alphabetProgress = progress.rows.filter(r => r.type === 'alphabet');
    const numbersProgress = progress.rows.filter(r => r.type === 'numbers');

    res.json({
      child: child.rows[0],
      stats: {
        alphabet: {
          total: 33,
          completed: alphabetProgress.filter(r => r.status === 'completed').length,
          inProgress: alphabetProgress.filter(r => r.status === 'in_progress').length,
          lessons: alphabetProgress
        },
        numbers: {
          total: 20,
          completed: numbersProgress.filter(r => r.status === 'completed').length,
          inProgress: numbersProgress.filter(r => r.status === 'in_progress').length,
          lessons: numbersProgress
        },
        weeklyUsage: weeklyUsage.rows,
        recentSessions: recentSessions.rows,
        achievements: achievements.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
