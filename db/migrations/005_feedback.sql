-- 「このページは役に立ちましたか」の集計（個人情報なし。自由記述は受け付けない）。reason='' の行が回答数、それ以外は理由の内訳
CREATE TABLE IF NOT EXISTS feedback ( date TEXT NOT NULL, path TEXT NOT NULL, answer TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (date, path, answer, reason) );
