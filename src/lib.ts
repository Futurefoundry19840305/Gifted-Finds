import products from "./data/products.json";
import site from "./site.config.json";

export type Product = {
  name: string; price: number | null; image: string | null; shop: string | null;
  availability: number; reviewAvg: number | null; reviewCount: number | null; fetchedAt: string;
};

const items = (products as { items: Record<string, Product> }).items;
export const getProduct = (code: string): Product | undefined => items[code];

// 価格は取得から24時間以内のものだけ表示する（SG-01）
export function freshPrice(p: Product, now = Date.now()): number | null {
  if (p.price == null) return null;
  return now - new Date(p.fetchedAt).getTime() <= 24 * 3600 * 1000 ? p.price : null;
}

export const goUrl = (article: string, code: string, position: string, version: number) =>
  `/go/${article}/${code.replace(":", "~")}/${position}/${version}/`;

export const genreName = (g: string) => (site.genres as Record<string, string>)[g] ?? g;

export const fmtDate = (d: Date | string) =>
  new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(d));
export const fmtDateTime = (d: Date | string) =>
  new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }).format(new Date(d));
