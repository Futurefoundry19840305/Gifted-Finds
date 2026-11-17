import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import site from "./src/site.config.json" with { type: "json" };

export default defineConfig({
  site: site.url,
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [sitemap({ filter: (p) => !p.includes("/go/") && !p.includes("/404") })],
});
