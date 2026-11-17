import { describe, it, expect } from "vitest";
import { isAllowedRedirect, parseGoPath, firstImage } from "../worker/index";

describe("isAllowedRedirect", () => {
  it("楽天のURLだけ許可する", () => {
    expect(isAllowedRedirect("https://hb.afl.rakuten.co.jp/hgc/abc")).toBe(true);
    expect(isAllowedRedirect("https://item.rakuten.co.jp/shop/1/")).toBe(true);
    expect(isAllowedRedirect("https://rakuten.co.jp.evil.com/")).toBe(false);
    expect(isAllowedRedirect("https://evilrakuten.co.jp/")).toBe(false);
    expect(isAllowedRedirect("http://item.rakuten.co.jp/")).toBe(false);
    expect(isAllowedRedirect("javascript:alert(1)")).toBe(false);
    expect(isAllowedRedirect(null)).toBe(false);
  });
});

describe("parseGoPath", () => {
  it("正しい形式を読む", () => {
    expect(parseGoPath("/go/oseibo-ham/shop~1234/top/2/")).toEqual({ articleId: "oseibo-ham", itemCode: "shop:1234", position: "top", version: 2 });
  });
  it("不正な形式は拒否する", () => {
    expect(parseGoPath("/go/oseibo-ham/shop~1234/top/")).toBeNull();
    expect(parseGoPath("/go/../shop~1/top/1/")).toBeNull();
    expect(parseGoPath("/go/a/https:~~evil.com/top/1/")).toBeNull();
    expect(parseGoPath("/go/a/shop~1/side/1/")).toBeNull();
    expect(parseGoPath("/go/a/shop~1/top/0/")).toBeNull();
    expect(parseGoPath("/go/A B/shop~1/top/1/")).toBeNull();
  });
});

describe("firstImage", () => {
  it("formatVersion 1/2 どちらの形でも https にする", () => {
    expect(firstImage({ mediumImageUrls: ["http://thumbnail.image.rakuten.co.jp/a.jpg"] } as any)).toBe("https://thumbnail.image.rakuten.co.jp/a.jpg");
    expect(firstImage({ mediumImageUrls: [{ imageUrl: "https://x.rakuten.co.jp/b.jpg" }] } as any)).toBe("https://x.rakuten.co.jp/b.jpg");
    expect(firstImage({} as any)).toBeNull();
  });
});

import { normalizeViewPath } from "../worker/index";
describe("normalizeViewPath", () => {
  it("サイト内のパスだけ受け付ける", () => {
    expect(normalizeViewPath("/")).toBe("/");
    expect(normalizeViewPath("/food/oseibo-ham/")).toBe("/food/oseibo-ham/");
    expect(normalizeViewPath("/food/oseibo-ham/?email=a@b.c")).toBeNull();
    expect(normalizeViewPath("https://evil.com/")).toBeNull();
    expect(normalizeViewPath("/a/" + "x".repeat(200) + "/")).toBeNull();
  });
});

import { parseFeedback } from "../worker/index";
describe("parseFeedback", () => {
  it("決まった選択肢だけ受け付ける", () => {
    expect(parseFeedback("/food/a/|yes|")).toEqual({ path: "/food/a/", answer: "yes", reason: "" });
    expect(parseFeedback("/food/a/|no|price")).toEqual({ path: "/food/a/", answer: "no", reason: "price" });
    expect(parseFeedback("/food/a/|no|山田です")).toBeNull();
    expect(parseFeedback("/food/a/?x=1|yes|")).toBeNull();
    expect(parseFeedback("/food/a/|maybe|")).toBeNull();
  });
});
