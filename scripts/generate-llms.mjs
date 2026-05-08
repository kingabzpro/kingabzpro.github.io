import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const siteUrl = "https://abidaliawan.com";
const outputPath = path.resolve("public", "llms.txt");
const contentDir = path.resolve("src", "content");

const sections = [
  ["about", "About", "about"],
  ["works", "Work", "work"],
  ["projects", "Projects", "projects"],
  ["studies", "Studies", "studies"],
  ["certificates", "Certifications", "certifications"],
];

function stripQuotes(value) {
  return value.trim().replace(/^["']|["']$/g, "");
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((item) => stripQuotes(item))
        .filter(Boolean);
    }
  }

  return stripQuotes(trimmed);
}

function parseMarkdownFile(filePath) {
  const source = readFileSync(filePath, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: source };
  }

  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (field) {
      frontmatter[field[1]] = parseScalar(field[2]);
    }
  }

  return { frontmatter, body: match[2].trim() };
}

function firstSummary(body) {
  const text = body
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" ");

  if (!text) {
    return "";
  }

  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}

function summarizeItems(items, limit = 8) {
  const names = items.map((item) => item.label).filter(Boolean);
  if (names.length === 0) {
    return "";
  }

  const visible = names.slice(0, limit).join("; ");
  const remaining = names.length > limit ? `; and ${names.length - limit} more` : "";
  return `${visible}${remaining}.`;
}

function collectSection(section) {
  const sectionDir = path.join(contentDir, section);
  return readdirSync(sectionDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const slug = entry.name.replace(/\.md$/, "");
      const { frontmatter, body } = parseMarkdownFile(path.join(sectionDir, entry.name));
      const title = frontmatter.title ?? slug;
      const label = [title, frontmatter.org ?? frontmatter.institute, frontmatter.date]
        .filter(Boolean)
        .join(" - ");
      const topics = Array.isArray(frontmatter.tags) ? frontmatter.tags.join(", ") : frontmatter.tags;
      const summary = firstSummary(body);
      const details = [summary, topics ? `Topics: ${topics}.` : ""].filter(Boolean).join(" ");

      return {
        title,
        label,
        details,
      };
    });
}

function collectAbout() {
  const { body } = parseMarkdownFile(path.join(contentDir, "about", "about.md"));
  return firstSummary(body);
}

function collectContactLinks() {
  const sectionDir = path.join(contentDir, "contact");
  return readdirSync(sectionDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const { frontmatter } = parseMarkdownFile(path.join(sectionDir, entry.name));
      return {
        title: frontmatter.title,
        url: frontmatter.externalUrl,
      };
    })
    .filter((item) => item.title && item.url && !String(item.url).startsWith("#"));
}

const lines = [
  "# Abid Ali Awan",
  "",
  "> Official profile of Abid Ali Awan, a Data Scientist, AI engineer, MLOps consultant, and technical writer based in Islamabad, Pakistan.",
  "",
  "This file describes the one-page website at https://abidaliawan.com/. The markdown files in `src/content` are source fragments rendered inside the homepage accordions, not separate pages that should be treated as standalone context.",
  "",
  "## Primary Page",
  "",
  `- [Home and full profile](${siteUrl}/): Canonical page for Abid Ali Awan's about, work, studies, projects, certifications, contact, and social links.`,
  `- [XML sitemap](${siteUrl}/sitemap.xml): Canonical URLs intended for search indexing.`,
  `- [Robots policy](${siteUrl}/robots.txt): Crawler access policy for the site.`,
  "",
  "## Homepage Sections",
  "",
];

for (const [section, heading, anchor] of sections) {
  if (section === "about") {
    const aboutSummary = collectAbout();
    lines.push(`- [${heading}](${siteUrl}/#${anchor}): ${aboutSummary}`);
    continue;
  }

  const items = collectSection(section);
  const sectionSummary = summarizeItems(items);
  lines.push(`- [${heading}](${siteUrl}/#${anchor}): ${sectionSummary}`);
}

lines.push(
  "",
  "## Supporting Context",
  "",
);

for (const [section, heading] of sections.filter(([section]) => section !== "about")) {
  const items = collectSection(section);
  if (items.length === 0) {
    continue;
  }

  lines.push(`### ${heading}`, "");
  for (const item of items) {
    lines.push(`- ${item.label}${item.details ? `: ${item.details}` : ""}`);
  }
  lines.push("");
}

lines.push(
  "## Topics",
  "",
  "Data science, machine learning, MLOps, large language models, natural language processing, model fine-tuning, OCR, technical writing, technical editing, AI education, and production ML systems.",
  "",
  "## Official External Profiles",
  "",
);

for (const item of collectContactLinks()) {
  lines.push(`- [${item.title}](${item.url})`);
}

lines.push(
  "",
  "## Usage Notes",
  "",
  `Use ${siteUrl}/ as the canonical source. Do not treat markdown fragment routes as standalone public pages; they are source content for the one-page homepage experience.`,
  "",
);

writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log("[llms] generated public/llms.txt");
