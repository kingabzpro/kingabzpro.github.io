import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const sitemapPath = path.resolve("public", "sitemap.xml");
const siteUrl = "https://abidaliawan.com";

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function collectSourceFiles(dirPath) {
  return readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    return entry.isFile() ? [entryPath] : [];
  });
}

const homeSources = [
  path.resolve("src", "pages", "index.astro"),
  path.resolve("src", "layouts", "BaseLayout.astro"),
  path.resolve("src", "components", "Container.astro"),
  ...collectSourceFiles(path.resolve("src", "content")).filter((filePath) => filePath.endsWith(".md")),
];
const homeLastmod = toIsoDate(
  new Date(Math.max(...homeSources.map((filePath) => statSync(filePath).mtimeMs))),
);
const urls = [
  { loc: `${siteUrl}/`, lastmod: homeLastmod },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(sitemapPath, xml, "utf8");
console.log(`[sitemap] generated ${urls.length} canonical URLs`);
