-- マナー記事（要件 第8.5章）: 事実の元帳と、マナー記事からの流入記録
CREATE TABLE IF NOT EXISTS etiquette_facts (
  id TEXT PRIMARY KEY,          -- 例: oseibo-mizuhiki
  theme_id TEXT NOT NULL,       -- 例: oseibo
  topic TEXT NOT NULL,          -- 例: のし・水引
  fact TEXT NOT NULL,           -- 例: 水引は紅白の蝶結びが一般的
  region TEXT,                  -- 地域差がある場合（例: 関東）
  source1_url TEXT NOT NULL,
  source2_url TEXT NOT NULL,
  checked_at TEXT NOT NULL,     -- YYYY-MM-DD
  note TEXT
);
ALTER TABLE clicks ADD COLUMN from_manner TEXT;
