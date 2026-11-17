import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string().max(60),
    description: z.string().min(50).max(140),
    genre: z.enum(["gift", "kaden", "food", "outdoor"]),
    theme: z.string(),
    type: z.enum(["ranking", "guide"]),
    status: z.enum(["draft", "published", "held"]).default("draft"),
    version: z.number().int().min(1),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    // 比較軸（品質スコアSG-02：3つ以上）
    axes: z.array(z.string()).min(3),
    products: z.array(z.object({
      code: z.string(),                       // shop:1234
      position: z.enum(["top", "list", "bottom", "table"]).default("list"),
      label: z.string().optional(),           // 例: 予算5,000円で選ぶなら
      points: z.array(z.string()).max(4).default([]),
    })).default([]),
  }),
});

export const collections = { articles };
