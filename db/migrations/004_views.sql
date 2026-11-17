-- 閲覧数（日付×パスの集計のみ。IP・端末・Cookieなど個人に結びつく情報は持たない）
CREATE TABLE IF NOT EXISTS views ( date TEXT NOT NULL, path TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (date, path) );
