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

const manners = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/manners" }),
  schema: z.object({
    title: z.string().max(60),
    description: z.string().min(50).max(140),
    theme: z.string(),
    status: z.enum(["draft", "review", "published"]).default("draft"), // review = 人の確認待ち（SG-09）
    checked: z.coerce.date(),                     // 内容の確認日
    summary: z.array(z.string()).min(2).max(4),   // 要点
    facts: z.array(z.string()).min(1),            // etiquette_facts のID（SG-07）
    sources: z.array(z.object({ title: z.string(), url: z.string().url() })).min(2),
    cases: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    letters: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
    related: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { articles, manners };
