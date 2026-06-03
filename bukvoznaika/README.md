# 🐻 Буквознайка

Интерактивное образовательное приложение для детей 4–8 лет.  
Учим русский алфавит (33 буквы) и счёт (1–20) вместе с персонажем Лёней!

---

## 📁 Структура проекта

```
bukvoznaika/
├── frontend/          # React-приложение (UI)
│   ├── src/
│   │   ├── components/
│   │   │   └── shared/
│   │   │       ├── Lenya.jsx        # Персонаж Лёня (маскот)
│   │   │       └── Stars.jsx        # Звёзды, прогресс-бары
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── AuthPages.jsx    # Вход / Регистрация
│   │   │   │   └── ProfilesPage.jsx # Выбор профиля ребёнка
│   │   │   ├── child/
│   │   │   │   ├── LearnHomePage.jsx    # Главная экран ребёнка
│   │   │   │   ├── AlphabetMapPage.jsx  # Карта букв (33 клетки)
│   │   │   │   ├── LetterLessonPage.jsx # Урок по букве
│   │   │   │   ├── NumberPages.jsx      # Карта и уроки чисел
│   │   │   │   ├── GamesPage.jsx        # Мини-игры
│   │   │   │   └── AchievementsPage.jsx # Достижения
│   │   │   └── parent/
│   │   │       └── ParentDashboard.jsx  # Статистика для родителей
│   │   ├── store/
│   │   │   └── AppContext.jsx       # Глобальное состояние
│   │   ├── utils/
│   │   │   ├── api.js               # HTTP-клиент + офлайн-очередь
│   │   │   └── content.js           # Данные алфавита, чисел, игр
│   │   └── styles/
│   │       └── global.css           # Дизайн-система
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json            # PWA манифест (для APK)
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/           # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # PostgreSQL пул соединений
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js              # /api/auth/*
│   │   │   ├── children.js          # /api/children/*
│   │   │   └── lessons.js           # /api/lessons/*
│   │   ├── migrations/
│   │   │   ├── 001_initial.sql      # Полная схема БД + seed-данные
│   │   │   └── run.js               # Менеджер миграций
│   │   └── server.js                # Express app
│   ├── Dockerfile
│   └── .env.example
│
└── docker-compose.yml
```

---

## 🚀 Быстрый старт

### Вариант 1: Docker Compose (рекомендуется)

```bash
# 1. Клонировать / распаковать проект
cd bukvoznaika

# 2. Создать файл с переменными окружения
cp backend/.env.example .env
# Отредактировать .env — сменить пароли и секреты!

# 3. Запустить всё одной командой
docker-compose up -d

# Приложение доступно:
# Frontend → http://localhost:3000
# Backend API → http://localhost:3001/api
```

### Вариант 2: Ручной запуск

**Требования:** Node.js 18+, PostgreSQL 14+

```bash
# --- База данных ---
psql -U postgres -c "CREATE DATABASE bukvoznaika;"

# --- Бэкенд ---
cd backend
cp .env.example .env
# Заполнить .env своими данными (DB_PASSWORD, JWT_SECRET и т.д.)
npm install
node src/migrations/run.js   # Создаёт таблицы + добавляет уроки
npm start                    # Запускает на порту 3001

# --- Фронтенд (в другом терминале) ---
cd ../frontend
npm install
npm start                    # Запускает на порту 3000
```

---

## 📱 Сборка APK (web-to-app)

Используем инструмент **https://github.com/shiahonb777/web-to-app**

### Шаг 1: Сборка production-версии

```bash
cd frontend

# Указать URL вашего задеплоенного бэкенда
echo "REACT_APP_API_URL=https://YOUR_SERVER/api" > .env.production

npm run build
# Папка build/ готова
```

### Шаг 2: Деплой фронтенда

Загрузите содержимое `frontend/build/` на хостинг:
- **Netlify**: перетащите папку build на netlify.com/drop
- **Vercel**: `vercel --prod`
- **VPS**: скопируйте в nginx/apache + настройте SSL

Запомните URL, например: `https://bukvoznaika.netlify.app`

### Шаг 3: Деплой бэкенда

```bash
# На VPS / Railway / Render:
cd backend
npm install --production
node src/migrations/run.js
npm start
```

Или используйте Railway.app / Render.com для автоматического деплоя.

### Шаг 4: Конвертация в APK

```bash
# Установить web-to-app
git clone https://github.com/shiahonb777/web-to-app
cd web-to-app
npm install

# Конфигурация приложения
# В config.json укажите:
# {
#   "url": "https://bukvoznaika.netlify.app",
#   "appName": "Буквознайка",
#   "packageName": "ru.bukvoznaika.app",
#   "versionCode": 1,
#   "versionName": "1.0.0"
# }

npm run build:apk
# APK файл появится в ./output/bukvoznaika.apk
```

---

## 🗄️ Схема базы данных

```
parents              children             lessons
───────────          ────────────         ──────────
id (UUID)            id (UUID)            id (SERIAL)
email                parent_id → parents  category_id
password_hash        name                 title
name                 avatar               type (alphabet|numbers)
pin_hash             age                  content_key
weekly_report        daily_limit_mins     order_index
                     total_stars          required_level
                     current_level        stars_reward

child_lesson_progress    learning_sessions    achievements
─────────────────────    ─────────────────    ────────────
child_id                 child_id             key
lesson_id                started_at           title
status                   ended_at             icon
stars_earned             duration_seconds     stars_required
attempts                 lessons_completed    lessons_required
completed_at             stars_earned
```

---

## 🔌 API эндпоинты

### Авторизация
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/register` | Регистрация родителя |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/refresh` | Обновление токена |
| POST | `/api/auth/verify-pin` | Проверка PIN |
| POST | `/api/auth/set-pin` | Установить PIN |

### Дети
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/children` | Список профилей |
| POST | `/api/children` | Создать профиль |
| PUT | `/api/children/:id` | Обновить профиль |
| DELETE | `/api/children/:id` | Удалить профиль |
| GET | `/api/children/:id/stats` | Детальная статистика |

### Уроки
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/lessons?type=alphabet&childId=...` | Список уроков |
| GET | `/api/lessons/:id/exercises` | Упражнения урока |
| POST | `/api/lessons/:id/progress` | Сохранить прогресс |
| POST | `/api/lessons/session/start` | Начать сессию |
| POST | `/api/lessons/session/end` | Завершить сессию |

---

## ✨ Функциональность

### Для детей (4–8 лет)
- ✅ Выбор профиля по аватарку (без паролей)
- ✅ 33 интерактивных урока по буквам алфавита
- ✅ 20 уроков по числам (1–20) + арифметика
- ✅ 3 типа упражнений: распознавание, сопоставление, обводка
- ✅ Мини-игры: «Найди пару», «Быстрый счёт»
- ✅ Персонаж Лёня с мгновенной обратной связью
- ✅ Система звёзд и достижений (8 достижений)
- ✅ Прогрессивная разблокировка уроков

### Для родителей
- ✅ Регистрация / вход по email + пароль
- ✅ До 3 профилей детей
- ✅ Детальная статистика: графики, диаграммы, прогресс
- ✅ Недельное использование (BarChart)
- ✅ Установка лимита времени на ребёнка
- ✅ PIN-код для защиты родительского кабинета
- ✅ Просмотр достижений каждого ребёнка

### Технические
- ✅ JWT-авторизация (access + refresh токены)
- ✅ Офлайн-режим с очередью синхронизации
- ✅ PWA (работает как приложение на телефоне)
- ✅ Rate limiting, Helmet security headers
- ✅ bcrypt для паролей и PIN-кодов
- ✅ PostgreSQL миграции с seed-данными
- ✅ Docker Compose для одной командой запуска

---

## 🔐 Безопасность

- Пароли хешируются через **bcrypt** (cost factor 12)
- PIN-код хешируется через bcrypt
- JWT токены: access (1 час) + refresh (30 дней)
- Refresh-токены хранятся в БД в виде хешей
- Rate limiting: 100 req/15min общий, 20 req/15min на /auth
- Helmet.js: XSS, clickjacking, MIME-sniffing защита
- Каждый запрос проверяет принадлежность child к parent

---

## 🎨 Дизайн-система

Цветовая палитра специально подобрана для детей:
- 🟡 Жёлтый `#FFD93D` — основные кнопки, звёзды
- 🟣 Фиолетовый `#A855F7` — акценты, вторичные действия  
- 🌸 Розовый `#FF6B9D` — раздел «Буквы»
- 🔵 Синий `#3B82F6` — раздел «Игры»
- 🟢 Зелёный `#22C55E` — успех, завершение

Шрифты: **Baloo 2** (заголовки) + **Nunito** (текст) — оба оптимизированы для чтения детьми.
