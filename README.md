# 季節の暮らしとギフト

楽天アフィリエイトの季節特集サイト。1つの Cloudflare Worker が、静的サイトの配信、`/go/` のクリック計測、楽天APIの定期取得をまとめて受け持つ。判断（記事の生成・分析・ロールバック）は Claude の定期実行がこのリポジトリへのコミットで行う。

## 構成

| パス | 内容 |
| --- | --- |
| `worker/index.ts` | `/go/{記事}/{商品}/{位置}/{版}/` の計測と転送、Cron での楽天API取得 |
| `wrangler.jsonc` | Worker、D1（kisetsu-affiliate）、Cron の設定 |
| `db/schema.sql` / `db/seed.sql` | D1 のテーブルと初期テーマ（適用済み） |
| `src/content/articles/` | 記事（Markdown）。`status: published` だけが公開される |
| `src/data/products.json` | 記事に載せる商品のスナップショット（定期実行が D1 から書き出す） |
| `src/data/themes.json` | 季節テーマと状態（prepare / launch / peak / wind_down / dormant） |
| `src/content/manners/` | マナー記事。事実は `src/data/etiquette.json`（D1 `etiquette_facts` の書き出し）にあるものだけを使う |
| `public/js/track.js` | マナー記事から比較記事へ進んだことを `/go/?m=` で記録 |
| `scripts/gate.mjs` | 公開前ゲート（比較記事：SG-01/02、マナー記事：SG-07/08）。`npm run check:gate` |

## 初回設定（Cloudflare ダッシュボード）

1. Workers & Pages → 作成 → 「Git リポジトリをインポート」で、このリポジトリを選ぶ
2. ビルドコマンド `npm run build`、デプロイコマンド `npx wrangler deploy`
3. デプロイ後に表示される `https://kisetsu-gift.<アカウント名>.workers.dev` を控え、次の3か所を同じURLにそろえる
   - `wrangler.jsonc` の `vars.SITE_URL`
   - `src/site.config.json` の `url`、`public/robots.txt` の Sitemap 行
   - 楽天ウェブサービスのアプリ設定の「WebサイトURL」（Referer チェック用）
4. Worker の「設定 → 変数とシークレット」に、種類「シークレット」で3つ登録する
   - `RAKUTEN_APP_ID`、`RAKUTEN_ACCESS_KEY`、`RAKUTEN_AFFILIATE_ID`
5. Worker の「設定 → 可観測性」と、Web Analytics を有効にする

## ローカル確認

```
npm install
npm test            # Worker の単体テスト
npm run build       # サイトのビルド
npm run check:gate  # 公開前ゲート
```
