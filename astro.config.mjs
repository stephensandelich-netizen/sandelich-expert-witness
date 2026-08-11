import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

const astroCommand = process.argv.find((arg) => ["build", "check", "dev", "sync"].includes(arg));
const isCheckerCommand = astroCommand === "check" || astroCommand === "sync";

// https://astro.build/config
export default defineConfig({
  site: "https://www.sandelichexpertwitness.com",
  // Static output — deployed to Cloudflare Pages, no server adapter needed.
  // i18n configuration must match src/config/translations.json.ts
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    ...(!isCheckerCommand && {
      processor: unified(),
    }),
    shikiConfig: {
      // Shiki Themes: https://github.com/shikijs/shiki/blob/main/docs/themes.md
      theme: "dracula",
      wrap: true,
    },
  },
  integrations: [
    mdx(),
    react(),
    icon(),
    sitemap(),
  ],

  vite: {
    plugins: [tailwindcss()],
    // stop inlining short scripts to fix issues with ClientRouter
    build: {
      assetsInlineLimit: 0,
      target: "es2022",
    },
  },
});
