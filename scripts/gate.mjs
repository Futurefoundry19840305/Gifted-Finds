// 公開前ゲート（要件 FR-005 / SG-01 / SG-02）
// 使い方: node scripts/gate.mjs [記事ファイル...]   引数なしなら status: published の全記事
// 1件でも不合格なら終了コード1。結果はJSONで標準出力に出す（定期実行がそのまま読む）
import fs from "node:fs";
import path from "node:path";

const DIR = "src/content/articles";
const products = JSON.parse(fs.readFileSync("src/data/products.json", "utf8")).items;

// 景品表示法・健康増進法・薬機法の観点で、自動では使わない表現（要件 第7章）
const BANNED = [
  [/No\.?\s*1|ナンバーワン|業界一|日本一|世界一/i, "根拠のない最上級表示"],
  [/最安|最も安い|底値/, "最安表示"],
  [/絶対|必ず(?!ご確認)|100\s*%|確実に/, "断定表現"],
  [/免疫|痩せ|やせる|ダイエット効果|デトックス|体にいい|健康になる|病気|治る|予防/, "食品・家電の効能表現"],
  [/ウイルス(を)?(除去|除菌|撃退|99)|花粉を防/, "家電の性能断定（メーカー公表の引用以外不可）"],
  [/使ってみた|実際に使って|愛用して|私も買|購入してみ/, "体験を装う表現"],
];

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { file, fm: {}, body: raw, raw };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  const codes = [...m[1].matchAll(/code:\s*["']?([^"'\s]+)/g)].map((x) => x[1]);
  const axes = (m[1].match(/^axes:\s*\n((?:\s+-.*\n?)+)/m)?.[1] ?? "").split("\n").filter((l) => l.trim().startsWith("-"));
  return { file, fm, body: m[2], raw, codes, axes };
}

const shingles = (t, n = 5) => {
  const s = t.replace(/\s+/g, "");
  const set = new Set();
  for (let i = 0; i + n <= s.length; i++) set.add(s.slice(i, i + n));
  return set;
};
const jaccard = (a, b) => {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
};

const all = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).map((f) => parse(path.join(DIR, f)));
const targets = process.argv.length > 2 ? process.argv.slice(2).filter((f) => !f.includes("/manners/")).map(parse) : all.filter((a) => a.fm.status === "published");

const report = [];
for (const a of targets) {
  const errors = [];
  const text = a.fm.title + "\n" + (a.fm.description ?? "") + "\n" + a.body + "\n" + a.raw;
  for (const [re, why] of BANNED) {
    const hit = text.match(re);
    if (hit) errors.push(`禁止表現「${hit[0]}」: ${why}`);
  }
  if (!a.fm.title || a.fm.title.length > 60) errors.push("title が空か60字超");
  if (!a.fm.description || a.fm.description.length < 50 || a.fm.description.length > 140) errors.push("description が50〜140字でない");
  if (a.axes.length < 3) errors.push("比較軸が3つ未満（SG-02）");
  if (!/価格の(推移|動き)|レビュー.{0,10}(件数|平均|集計)/.test(a.body)) errors.push("独自データ（価格推移かレビュー集計）の節がない（SG-02）");
  const live = a.codes.filter((c) => products[c]?.availability === 1);
  if (live.length < 3) errors.push(`在庫ありの掲載商品が3件未満（${live.length}件）`);
  for (const c of a.codes) if (!products[c]) errors.push(`商品データがない: ${c}`);
  const mine = shingles(a.body);
  for (const b of all) {
    if (b.file === a.file || b.fm.status !== "published") continue;
    const j = jaccard(mine, shingles(b.body));
    if (j >= 0.3) errors.push(`既存記事との重複率 ${(j * 100).toFixed(0)}%: ${path.basename(b.file)}（SG-02）`);
  }
  report.push({ file: a.file, ok: errors.length === 0, errors });
}

// ---- マナー記事（要件 SG-07 / SG-08） ----
const MDIR = "src/content/manners";
const facts = JSON.parse(fs.readFileSync("src/data/etiquette.json", "utf8")).facts;
const manners = fs.existsSync(MDIR) ? fs.readdirSync(MDIR).filter((f) => f.endsWith(".md")).map((f) => path.join(MDIR, f)) : [];
const mTargets = process.argv.length > 2 ? process.argv.slice(2).filter((f) => f.includes("/manners/")) : manners;
for (const file of mTargets) {
  const raw = fs.readFileSync(file, "utf8");
  if (process.argv.length <= 2 && !/^status:\s*published/m.test(raw)) continue;
  const errors = [];
  const sources = (raw.match(/^\s+url:\s*\S+/gm) ?? []).length;
  if (sources < 2) errors.push(`出典が2件未満（${sources}件）（SG-07）`);
  const ids = (raw.match(/^facts:\s*\n((?:\s+-.*\n?)+)/m)?.[1] ?? "").split("\n").map((l) => l.replace(/^\s*-\s*/, "").replace(/["']/g, "").trim()).filter(Boolean);
  for (const id of ids) if (!facts[id]) errors.push(`元帳にない事実: ${id}（SG-07）`);
  const checked = raw.match(/^checked:\s*(\S+)/m)?.[1];
  if (!checked || Date.now() - new Date(checked).getTime() > 400 * 86400000) errors.push("確認日が400日より前か未記入");
  for (const re of [/必ず|絶対に|しなければなりません|常識です|非常識/]) { const h = raw.match(re); if (h) errors.push(`断定表現「${h[0]}」（SG-08）`); }
  if (!/一般的|地域|ご家庭/.test(raw)) errors.push("「一般的」「地域によって」などの言い方がない（SG-08）");
  report.push({ file, ok: errors.length === 0, errors });
}

// ---- 豆知識とツール（要件 第8.7章 / SG-07） ----
const tipData = JSON.parse(fs.readFileSync("src/data/tips.json", "utf8")).tips;
const toolData = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
const extra = [
  ...tipData.map((t) => ({ file: `tips.json#${t.id}`, status: t.status, facts: t.facts, text: t.title + t.body })),
  ...["noshi", "okaeshi", "chouju"].map((k) => ({ file: `tools.json#${k}`, status: toolData[k].status, facts: toolData[k].facts, text: JSON.stringify(toolData[k]) })),
];
for (const x of extra) {
  if (x.status !== "published") continue;
  const errors = [];
  for (const id of x.facts) if (!facts[id]) errors.push(`元帳にない事実: ${id}（SG-07）`);
  const h = x.text.match(/必ず|絶対に|しなければなりません|非常識/);
  if (h) errors.push(`断定表現「${h[0]}」（SG-08）`);
  report.push({ file: x.file, ok: errors.length === 0, errors });
}

console.log(JSON.stringify({ checked: report.length, failed: report.filter((r) => !r.ok).length, report }, null, 2));
process.exit(report.some((r) => !r.ok) ? 1 : 0);
