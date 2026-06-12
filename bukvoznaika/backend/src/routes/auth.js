const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bukvoznaika_secret_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'bukvoznaika_refresh_2024';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Неверный формат email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const existing = await pool.query('SELECT id FROM parents WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO parents (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email.toLowerCase(), passwordHash, name.trim()]
    );

    const parent = rows[0];
    const accessToken = jwt.sign({ parentId: parent.id, email: parent.email }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ parentId: parent.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    const refreshHash = await bcrypt.hash(refreshToken, 8);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (parent_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [parent.id, refreshHash, expiresAt]
    );

    res.status(201).json({
      parent: { id: parent.id, email: parent.email, name: parent.name },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' });
    }

    const { rows } = await pool.query('SELECT * FROM parents WHERE email = $1', [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const parent = rows[0];
    const validPassword = await bcrypt.compare(password, parent.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const accessToken = jwt.sign({ parentId: parent.id, email: parent.email }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ parentId: parent.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    const refreshHash = await bcrypt.hash(refreshToken, 8);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (parent_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [parent.id, refreshHash, expiresAt]
    );

    res.json({
      parent: { id: parent.id, email: parent.email, name: parent.name, pin_hash: !!parent.pin_hash },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token не найден' });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const { rows } = await pool.query(
      'SELECT * FROM refresh_tokens WHERE parent_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 10',
      [decoded.parentId]
    );

    let validToken = null;
    for (const row of rows) {
      const match = await bcrypt.compare(refreshToken, row.token_hash);
      if (match) { validToken = row; break; }
    }
    if (!validToken) return res.status(401).json({ error: 'Недействительный refresh token' });

    const newAccessToken = jwt.sign({ parentId: decoded.parentId }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Недействительный refresh token' });
  }
});

// POST /api/auth/verify-pin
router.post('/verify-pin', authMiddleware, async (req, res) => {
  try {
    const { pin } = req.body;
    const { rows } = await pool.query('SELECT pin_hash FROM parents WHERE id = $1', [req.user.parentId]);
    if (!rows[0]?.pin_hash) return res.json({ valid: true });
    const valid = await bcrypt.compare(String(pin), rows[0].pin_hash);
    res.json({ valid });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/auth/pin-status — проверка, установлен ли PIN
router.get('/pin-status', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT pin_hash FROM parents WHERE id = $1', [req.user.parentId]);
    res.json({ hasPin: !!rows[0]?.pin_hash });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/set-pin
router.post('/set-pin', authMiddleware, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || String(pin).length !== 4) {
      return res.status(400).json({ error: 'PIN должен состоять из 4 цифр' });
    }
    const pinHash = await bcrypt.hash(String(pin), 10);
    await pool.query('UPDATE parents SET pin_hash = $1 WHERE id = $2', [pinHash, req.user.parentId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
