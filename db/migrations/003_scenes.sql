-- シーン別（お祝い・ビジネス）のテーマ。季節テーマと同じ表に kind='scene' で入れる（要件 第8.6章）
ALTER TABLE themes ADD COLUMN kind TEXT NOT NULL DEFAULT 'season';
ALTER TABLE themes ADD COLUMN scene_group TEXT; -- business / personal
-- 初期データは 2026-11-17 に D1 へ適用済み（8テーマ）
