import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import compress from "astro-compress";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    icon(),
    compress(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return pathname === "/";
      },
    }),
  ],
  output: "static",
  site: "https://abidaliawan.com",
  build: {
    inlineStylesheets: "always",
  },
});
