require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const lessonRoutes = require('./routes/lessons');
const cardRoutes = require('./routes/cards');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/cards', cardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
module.exports = app;
