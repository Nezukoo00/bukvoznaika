const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Стоимость одного набора карточек в звёздах
const PACK_COST = 15;

// GET /api/cards?childId=... — все карточки + что собрано ребёнком
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.query;
    // Проверяем принадлежность ребёнка
    const childCheck = await pool.query(
      'SELECT id, total_stars FROM children WHERE id = $1 AND parent_id = $2',
      [childId, req.user.parentId]
    );
    if (!childCheck.rows[0]) return res.status(403).json({ error: 'Доступ запрещён' });

    const { rows } = await pool.query(`
      SELECT c.*, COALESCE(cc.count, 0) AS owned_count,
             (cc.id IS NOT NULL) AS owned
      FROM cards c
      LEFT JOIN child_cards cc ON cc.card_id = c.id AND cc.child_id = $1
      ORDER BY c.order_index
    `, [childId]);

    res.json({
      cards: rows,
      totalStars: childCheck.rows[0].total_stars,
      packCost: PACK_COST,
    });
  } catch (err) {
    console.error('Cards list error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/cards/open — открыть набор за звёзды
router.post('/open', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { childId } = req.body;

    const childCheck = await client.query(
      'SELECT id, total_stars FROM children WHERE id = $1 AND parent_id = $2',
      [childId, req.user.parentId]
    );
    if (!childCheck.rows[0]) return res.status(403).json({ error: 'Доступ запрещён' });

    const stars = childCheck.rows[0].total_stars;
    if (stars < PACK_COST) {
      return res.status(400).json({ error: 'Недостаточно звёзд', needed: PACK_COST, have: stars });
    }

    // Берём случайную карточку из доступных
    const allCards = await client.query('SELECT * FROM cards ORDER BY order_index');
    if (allCards.rows.length === 0) {
      return res.status(400).json({ error: 'Карточки пока недоступны' });
    }
    const card = allCards.rows[Math.floor(Math.random() * allCards.rows.length)];

    await client.query('BEGIN');

    // Списываем звёзды
    await client.query(
      'UPDATE children SET total_stars = total_stars - $1, updated_at = NOW() WHERE id = $2',
      [PACK_COST, childId]
    );

    // Выдаём карточку (или увеличиваем счётчик дубликата)
    const result = await client.query(`
      INSERT INTO child_cards (child_id, card_id, count)
      VALUES ($1, $2, 1)
      ON CONFLICT (child_id, card_id) DO UPDATE
      SET count = child_cards.count + 1
      RETURNING count
    `, [childId, card.id]);

    await client.query('COMMIT');

    const isNew = result.rows[0].count === 1;
    res.json({
      card,
      isNew,
      count: result.rows[0].count,
      remainingStars: stars - PACK_COST,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Card open error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

module.exports = router;
