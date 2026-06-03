-- =============================================
-- Коллекция карточек Лёни
-- =============================================

-- Справочник всех карточек
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  card_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  image VARCHAR(200) NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Карточки, собранные ребёнком
CREATE TABLE IF NOT EXISTS child_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  count INTEGER DEFAULT 1,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_child_cards_child ON child_cards(child_id);

-- Начальный набор карточек (тестовый прогон — одна карточка)
INSERT INTO cards (card_key, title, description, image, rarity, order_index) VALUES
  ('leni_cloud', 'Лёни на облачке', 'Ленивец Лёни сладко спит на пушистом облачке', '/cards/card-leni-cloud.jpg', 'common', 1)
ON CONFLICT (card_key) DO NOTHING;
