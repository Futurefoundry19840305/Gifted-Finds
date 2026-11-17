-- 季節の暮らしとギフト D1スキーマ v1
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,            -- 例: oseibo
  name TEXT NOT NULL,             -- 例: お歳暮
  genre TEXT NOT NULL,            -- gift / kaden / food / outdoor
  rakuten_genre_id TEXT,          -- ランキング取得用
  keyword TEXT,                   -- 商品検索用キーワード
  peak_start TEXT NOT NULL,       -- MM-DD
  peak_end TEXT NOT NULL,         -- MM-DD
  state TEXT NOT NULL DEFAULT 'dormant', -- prepare/launch/peak/wind_down/dormant
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,            -- スラッグ（URLの最後）
  genre TEXT NOT NULL,
  theme_id TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft/published/held
  version INTEGER NOT NULL DEFAULT 1,
  quality_score REAL,
  published_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS products (
  item_code TEXT PRIMARY KEY,     -- shop:1234 形式
  name TEXT, price INTEGER, item_url TEXT, affiliate_url TEXT, image_url TEXT,
  availability INTEGER, review_avg REAL, review_count INTEGER, shop_name TEXT,
  genre_id TEXT, fetched_at TEXT, missing_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS price_history (
  item_code TEXT NOT NULL, date TEXT NOT NULL, price INTEGER, availability INTEGER,
  PRIMARY KEY (item_code, date)
);
CREATE TABLE IF NOT EXISTS article_products (
  article_id TEXT NOT NULL, slot INTEGER NOT NULL, item_code TEXT NOT NULL,
  position TEXT,                  -- top / list / bottom
  PRIMARY KEY (article_id, slot)
);
CREATE TABLE IF NOT EXISTS rankings (
  date TEXT NOT NULL, genre_id TEXT NOT NULL, rank INTEGER NOT NULL, item_code TEXT NOT NULL,
  PRIMARY KEY (date, genre_id, rank)
);
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL, article_id TEXT, item_code TEXT, position TEXT, version INTEGER,
  ref_host TEXT, device TEXT
);
CREATE INDEX IF NOT EXISTS idx_clicks_article_ts ON clicks(article_id, ts);
CREATE TABLE IF NOT EXISTS conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_date TEXT, item_name TEXT, shop_name TEXT, amount INTEGER, reward INTEGER,
  status TEXT, source_file TEXT, imported_at TEXT
);
CREATE TABLE IF NOT EXISTS changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL, article_id TEXT, kind TEXT, from_version INTEGER, to_version INTEGER,
  reason TEXT, evaluate_after TEXT, result TEXT -- pending/kept/rolled_back/extended
);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL, job TEXT NOT NULL, status TEXT NOT NULL, detail TEXT
);
-- 002_manners.sql も適用済み（etiquette_facts、clicks.from_manner）
