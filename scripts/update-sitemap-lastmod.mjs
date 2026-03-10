import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const sitemapPath = path.resolve("public", "sitemap.xml");
const today = new Date().toISOString().slice(0, 10);
const sitemap = readFileSync(sitemapPath, "utf8");

let updatedSitemap;
if (/<lastmod>[^<]*<\/lastmod>/.test(sitemap)) {
  updatedSitemap = sitemap.replace(
    /<lastmod>[^<]*<\/lastmod>/,
    `<lastmod>${today}</lastmod>`,
  );
} else {
  updatedSitemap = sitemap.replace(
    /(<loc>[^<]*<\/loc>)/,
    `$1\n    <lastmod>${today}</lastmod>`,
  );
}

if (updatedSitemap !== sitemap) {
  writeFileSync(sitemapPath, updatedSitemap, "utf8");
}

console.log(`[sitemap] lastmod set to ${today}`);
