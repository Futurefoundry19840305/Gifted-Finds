import { getCollection } from "astro:content";
// 公開済みだけをサイトに出す（draft / held は出さない）
export const publishedArticles = async () =>
  (await getCollection("articles", ({ data }) => data.status === "published"))
    .sort((a, b) => +b.data.updated - +a.data.updated);
