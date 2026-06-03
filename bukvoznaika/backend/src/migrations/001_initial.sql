-- =============================================
-- Буквознайка - Полная схема базы данных
-- =============================================

-- Родители / аккаунты
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255),
  weekly_report_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Профили детей
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(50) DEFAULT 'bear',
  age INTEGER CHECK (age BETWEEN 4 AND 8),
  daily_limit_minutes INTEGER DEFAULT 60,
  total_stars INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Категории уроков
CREATE TABLE IF NOT EXISTS lesson_categories (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('alphabet', 'numbers')),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL
);

-- Уроки
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES lesson_categories(id),
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('alphabet', 'numbers')),
  content_key VARCHAR(50) NOT NULL UNIQUE,
  order_index INTEGER NOT NULL,
  required_level INTEGER DEFAULT 1,
  stars_reward INTEGER DEFAULT 3,
  description TEXT
);

-- Упражнения
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('recognition', 'matching', 'pronunciation', 'minigame', 'tracing')),
  title VARCHAR(200) NOT NULL,
  content JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3)
);

-- Прогресс детей по урокам
CREATE TABLE IF NOT EXISTS child_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  stars_earned INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(child_id, lesson_id)
);

-- Прогресс по упражнениям
CREATE TABLE IF NOT EXISTS child_exercise_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  correct_answers INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(child_id, exercise_id)
);

-- Достижения
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  stars_required INTEGER DEFAULT 0,
  lessons_required INTEGER DEFAULT 0
);

-- Достижения детей
CREATE TABLE IF NOT EXISTS child_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, achievement_id)
);

-- Сессии обучения (для статистики)
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  lessons_completed INTEGER DEFAULT 0,
  stars_earned INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0
);

-- Ежедневное время использования
CREATE TABLE IF NOT EXISTS daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_minutes INTEGER DEFAULT 0,
  UNIQUE(child_id, date)
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_progress_child ON child_lesson_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON child_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON learning_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_child_date ON daily_usage(child_id, date);

-- =============================================
-- Seed: Категории и уроки алфавита
-- =============================================

INSERT INTO lesson_categories (type, name, description, order_index) VALUES
  ('alphabet', 'Русский алфавит', 'Изучаем буквы от А до Я', 1),
  ('numbers', 'Счёт и цифры', 'Учимся считать от 1 до 20', 2)
ON CONFLICT DO NOTHING;

-- Буквы алфавита (33 урока)
DO $$
DECLARE
  cat_id INTEGER;
  letters TEXT[] := ARRAY['А','Б','В','Г','Д','Е','Ё','Ж','З','И','Й','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Ъ','Ы','Ь','Э','Ю','Я'];
  words TEXT[] := ARRAY['Арбуз','Белка','Волк','Гусь','Дом','Ёж','Ёлка','Жираф','Заяц','Игла','Йогурт','Кот','Лиса','Мышь','Нос','Облако','Петух','Рыба','Слон','Тигр','Утка','Фонарь','Хлеб','Цапля','Чайник','Шар','Щука','Объект','Рыбы','Олень','Эхо','Юла','Яблоко'];
  i INTEGER;
BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE type = 'alphabet';
  FOR i IN 1..33 LOOP
    INSERT INTO lessons (category_id, title, type, content_key, order_index, required_level, stars_reward, description)
    VALUES (
      cat_id,
      'Буква ' || letters[i],
      'alphabet',
      'letter_' || i,
      i,
      CASE WHEN i <= 10 THEN 1 WHEN i <= 22 THEN 2 ELSE 3 END,
      3,
      'Учим букву ' || letters[i] || '. Слово: ' || words[i]
    )
    ON CONFLICT (content_key) DO NOTHING;
  END LOOP;
END $$;

-- Числа (20 уроков)
DO $$
DECLARE
  cat_id INTEGER;
  num_names TEXT[] := ARRAY['Один','Два','Три','Четыре','Пять','Шесть','Семь','Восемь','Девять','Десять','Одиннадцать','Двенадцать','Тринадцать','Четырнадцать','Пятнадцать','Шестнадцать','Семнадцать','Восемнадцать','Девятнадцать','Двадцать'];
  i INTEGER;
BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE type = 'numbers';
  FOR i IN 1..20 LOOP
    INSERT INTO lessons (category_id, title, type, content_key, order_index, required_level, stars_reward, description)
    VALUES (
      cat_id,
      'Число ' || i,
      'numbers',
      'number_' || i,
      i,
      CASE WHEN i <= 5 THEN 1 WHEN i <= 10 THEN 2 ELSE 3 END,
      3,
      'Учим число ' || i || ' — ' || num_names[i]
    )
    ON CONFLICT (content_key) DO NOTHING;
  END LOOP;
END $$;

-- Достижения
INSERT INTO achievements (key, title, description, icon, stars_required, lessons_required) VALUES
  ('first_star', 'Первая звезда', 'Получи свою первую звезду', '⭐', 1, 0),
  ('five_stars', 'Коллекционер звёзд', 'Собери 5 звёзд', '🌟', 5, 0),
  ('ten_lessons', 'Прилежный ученик', 'Пройди 10 уроков', '📚', 0, 10),
  ('alphabet_master', 'Знаток алфавита', 'Выучи все буквы алфавита', '🔤', 0, 33),
  ('number_master', 'Математик', 'Выучи все числа до 20', '🔢', 0, 20),
  ('week_streak', 'Неделя подряд', 'Занимайся 7 дней подряд', '🔥', 0, 0),
  ('fifty_stars', 'Звёздный собиратель', 'Собери 50 звёзд', '💫', 50, 0),
  ('hundred_stars', 'Чемпион звёзд', 'Собери 100 звёзд', '🏆', 100, 0)
ON CONFLICT (key) DO NOTHING;
