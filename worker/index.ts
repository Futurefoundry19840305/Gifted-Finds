// 季節の暮らしとギフト — Cloudflare Worker
// 役割: (1) /go/ のクリック計測と楽天への転送 (2) Cronでの楽天API取得 (3) それ以外は静的サイトを配信

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SITE_URL: string;               // 楽天ウェブサービスに登録したURL（Referer用）
  RAKUTEN_APP_ID: string;         // シークレット
  RAKUTEN_ACCESS_KEY: string;     // シークレット
  RAKUTEN_AFFILIATE_ID: string;   // シークレット
}

const SEARCH_URL = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";
const RANKING_URL = "https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601";
// 無料プランのサブリクエスト上限（1回50）に余裕を持たせる
const MAX_API_CALLS_PER_RUN = 35;
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

// ---------- クリック計測 ----------

export function isAllowedRedirect(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    return u.hostname === "rakuten.co.jp" || u.hostname.endsWith(".rakuten.co.jp");
  } catch {
    return false;
  }
}

// /go/{articleId}/{itemCode}/{position}/{version}
// itemCode は "shop:1234" の ":" を "~" に置き換えて渡す
export function parseGoPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 5 || parts[0] !== "go") return null;
  const [, articleId, itemRaw, position, versionRaw] = parts.map(decodeURIComponent);
  const slug = /^[a-z0-9-]{1,80}$/;
  if (!slug.test(articleId)) return null;
  if (!/^[A-Za-z0-9_\-]+~[A-Za-z0-9_\-]+$/.test(itemRaw)) return null;
  if (!/^(top|list|bottom|table)$/.test(position)) return null;
  const version = Number(versionRaw);
  if (!Number.isInteger(version) || version < 1 || version > 9999) return null;
  return { articleId, itemCode: itemRaw.replace("~", ":"), position, version };
}

async function handleGo(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const p = parseGoPath(url.pathname);
  if (!p) return new Response("Bad Request", { status: 400 });

  const row = await env.DB.prepare(
    "SELECT affiliate_url, item_url FROM products WHERE item_code = ?"
  ).bind(p.itemCode).first<{ affiliate_url: string | null; item_url: string | null }>();

  const target = row?.affiliate_url || row?.item_url;
  if (!isAllowedRedirect(target)) {
    // 楽天以外には転送しない（オープンリダイレクト対策）。理由と戻り方を示すページへ案内する
    return Response.redirect(new URL("/unavailable/", url).toString(), 302);
  }

  const ua = request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) {
    const ref = request.headers.get("referer");
    let refHost: string | null = null;
    try { refHost = ref ? new URL(ref).hostname : null; } catch { /* 無視 */ }
    const device = /mobile|iphone|android/i.test(ua) ? "mobile" : "desktop";
    const m = url.searchParams.get("m");
    const fromManner = m && /^[a-z0-9-]{1,80}$/.test(m) ? m : null;
    ctx.waitUntil(
      env.DB.prepare(
        "INSERT INTO clicks (ts, article_id, item_code, position, version, ref_host, device, from_manner) VALUES (?,?,?,?,?,?,?,?)"
      ).bind(new Date().toISOString(), p.articleId, p.itemCode, p.position, p.version, refHost, device, fromManner).run()
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target!,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  });
}

// ---------- 閲覧数（個人情報を扱わない集計） ----------
// 受け取るのはパスだけ。IP・ヘッダー・Cookieは読まず、保存もしない。
export function normalizeViewPath(raw: string): string | null {
  const p = raw.trim();
  if (p.length > 120) return null;
  return /^\/(?:[a-z0-9-]+\/)*$/.test(p) ? p : null;
}

async function handleView(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const ua = request.headers.get("user-agent") || "";
  const path = normalizeViewPath((await request.text()).slice(0, 200));
  if (path && !BOT_UA.test(ua)) {
    const date = new Date().toISOString().slice(0, 10);
    ctx.waitUntil(env.DB.prepare(
      "INSERT INTO views (date, path, count) VALUES (?, ?, 1) ON CONFLICT(date, path) DO UPDATE SET count = count + 1"
    ).bind(date, path).run());
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

// ---------- 記事の評価（個人情報を扱わない集計） ----------
const FEEDBACK_REASONS = new Set(["", "found", "clear", "hard-to-choose", "not-found", "price", "too-long"]);
export function parseFeedback(raw: string) {
  const [path, answer, reason = ""] = raw.slice(0, 200).split("|");
  if (!normalizeViewPath(path ?? "") || (answer !== "yes" && answer !== "no") || !FEEDBACK_REASONS.has(reason)) return null;
  return { path, answer, reason };
}

async function handleFeedback(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const f = parseFeedback(await request.text());
  if (f) {
    const date = new Date().toISOString().slice(0, 10);
    ctx.waitUntil(env.DB.prepare(
      "INSERT INTO feedback (date, path, answer, reason, count) VALUES (?, ?, ?, ?, 1) ON CONFLICT(date, path, answer, reason) DO UPDATE SET count = count + 1"
    ).bind(date, f.path, f.answer, f.reason).run());
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

// ---------- 楽天API ----------

type RakutenItem = {
  itemCode: string; itemName: string; itemPrice: number; itemUrl: string;
  affiliateUrl?: string; mediumImageUrls?: (string | { imageUrl: string })[];
  availability?: number; reviewAverage?: number; reviewCount?: number;
  shopName?: string; genreId?: string; rank?: number;
};

async function callRakuten(env: Env, base: string, params: Record<string, string>) {
  const qs = new URLSearchParams({
    applicationId: env.RAKUTEN_APP_ID,
    affiliateId: env.RAKUTEN_AFFILIATE_ID,
    formatVersion: "2",
    ...params,
  });
  const res = await fetch(`${base}?${qs}`, {
    headers: {
      accessKey: env.RAKUTEN_ACCESS_KEY,
      Referer: env.SITE_URL,
      Origin: new URL(env.SITE_URL).origin,
    },
  });
  if (res.status === 404) return { items: [] as RakutenItem[] };
  if (!res.ok) throw new Error(`Rakuten ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { items?: RakutenItem[]; Items?: RakutenItem[] };
  return { items: json.items ?? json.Items ?? [] };
}

export function firstImage(it: RakutenItem): string | null {
  const m = it.mediumImageUrls?.[0];
  if (!m) return null;
  const u = typeof m === "string" ? m : m.imageUrl;
  return u ? u.replace(/^http:/, "https:") : null;
}

function upsertProduct(env: Env, it: RakutenItem, now: string) {
  return env.DB.prepare(
    `INSERT INTO products (item_code,name,price,item_url,affiliate_url,image_url,availability,review_avg,review_count,shop_name,genre_id,fetched_at,missing_count)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)
     ON CONFLICT(item_code) DO UPDATE SET name=excluded.name, price=excluded.price, item_url=excluded.item_url,
       affiliate_url=excluded.affiliate_url, image_url=excluded.image_url, availability=excluded.availability,
       review_avg=excluded.review_avg, review_count=excluded.review_count, shop_name=excluded.shop_name,
       genre_id=excluded.genre_id, fetched_at=excluded.fetched_at, missing_count=0`
  ).bind(
    it.itemCode, it.itemName, it.itemPrice, it.itemUrl, it.affiliateUrl ?? null, firstImage(it),
    it.availability ?? 1, it.reviewAverage ?? null, it.reviewCount ?? null, it.shopName ?? null,
    it.genreId ? String(it.genreId) : null, now
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runDaily(env: Env, cron: string) {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  let calls = 0;
  const log: string[] = [];
  try {
    // 1) 稼働中テーマのランキング（1日1回、4:00 JST の実行時のみ）
    if (cron === "0 19 * * *") {
      const { results: genres } = await env.DB.prepare(
        "SELECT DISTINCT rakuten_genre_id AS g FROM themes WHERE state != 'dormant' AND rakuten_genre_id IS NOT NULL"
      ).all<{ g: string }>();
      for (const { g } of genres) {
        if (calls >= MAX_API_CALLS_PER_RUN) break;
        const { items } = await callRakuten(env, RANKING_URL, { genreId: g });
        calls++;
        const stmts = items.flatMap((it, i) => [
          upsertProduct(env, it, now),
          env.DB.prepare("INSERT OR REPLACE INTO rankings (date,genre_id,rank,item_code) VALUES (?,?,?,?)")
            .bind(today, g, it.rank ?? i + 1, it.itemCode),
        ]);
        if (stmts.length) await env.DB.batch(stmts);
        log.push(`ranking ${g}: ${items.length}`);
        await sleep(1100);
      }
    }

    // 2) 記事に載っている商品を、取得が古い順に更新
    const { results: targets } = await env.DB.prepare(
      `SELECT DISTINCT ap.item_code AS code FROM article_products ap
       LEFT JOIN products p ON p.item_code = ap.item_code
       ORDER BY COALESCE(p.fetched_at, '') ASC LIMIT ?`
    ).bind(MAX_API_CALLS_PER_RUN - calls).all<{ code: string }>();

    let updated = 0, missing = 0;
    for (const { code } of targets) {
      const { items } = await callRakuten(env, SEARCH_URL, { itemCode: code, hits: "1" });
      calls++;
      const it = items[0];
      if (it) {
        await env.DB.batch([
          upsertProduct(env, it, now),
          env.DB.prepare("INSERT OR REPLACE INTO price_history (item_code,date,price,availability) VALUES (?,?,?,?)")
            .bind(code, today, it.itemPrice, it.availability ?? 1),
        ]);
        updated++;
      } else {
        // 見つからない＝販売終了の可能性。在庫なし扱いにして日次処理で差し替え対象にする
        await env.DB.prepare(
          "UPDATE products SET availability=0, missing_count=missing_count+1, fetched_at=? WHERE item_code=?"
        ).bind(now, code).run();
        missing++;
      }
      await sleep(1100);
    }
    log.push(`items updated ${updated}, missing ${missing}`);
    await logRun(env, "cron:" + cron, "ok", log.join("; "));
  } catch (e) {
    log.push(String(e));
    await logRun(env, "cron:" + cron, "error", log.join("; "));
  }
}

function logRun(env: Env, job: string, status: string, detail: string) {
  return env.DB.prepare("INSERT INTO runs (ts,job,status,detail) VALUES (?,?,?,?)")
    .bind(new Date().toISOString(), job, status, detail.slice(0, 1000)).run();
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/go/")) return handleGo(request, env, ctx);
    if (url.pathname === "/v") return handleView(request, env, ctx);
    if (url.pathname === "/f") return handleFeedback(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runDaily(env, event.cron));
  },
};
