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
