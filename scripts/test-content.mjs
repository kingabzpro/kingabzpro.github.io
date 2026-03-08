import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "src", "pages");

const SECTION_RULES = {
  about: {
    pattern: /about\/.+\.md$/,
    required: ["name", "designation", "location", "pronouns", "headline"]
  },
  works: {
    pattern: /works\/.+\.md$/,
    required: ["title", "date", "url", "org", "location"]
  },
  studies: {
    pattern: /studies\/.+\.md$/,
    required: ["title", "date", "url", "institute", "location"]
  },
  projects: {
    pattern: /projects\/.+\.md$/,
    required: ["title", "date", "url", "tags", "image"]
  },
  certificates: {
    pattern: /certificates\/.+\.md$/,
    required: ["title", "date", "url", "tags"]
  },
  contact: {
    pattern: /contact\/.+\.md$/,
    required: ["title", "icon", "url"]
  }
};

const CONTRACTION_REGEX = /\b[A-Za-z]+(?:n't|'re|'ve|'ll|'d|'m)\b/g;
const EM_DASH_REGEX = /—/g;

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkMarkdown(fullPath);
      }
      return entry.name.endsWith(".md") ? [fullPath] : [];
    })
  );
  return files.flat();
}

function stripUrls(input) {
  return input.replace(/https?:\/\/\S+/g, " ");
}

function checkStyle(rawText, relativePath, errors) {
  const text = stripUrls(rawText);
  if (EM_DASH_REGEX.test(text)) {
    errors.push(`${relativePath}: contains an em dash`);
  }

  const contractions = text.match(CONTRACTION_REGEX);
  if (contractions?.length) {
    errors.push(`${relativePath}: contains contractions (${[...new Set(contractions)].join(", ")})`);
  }
}

function getSection(relativePath) {
  const entry = Object.entries(SECTION_RULES).find(([, rule]) => rule.pattern.test(relativePath));
  return entry ? entry[0] : null;
}

async function main() {
  const files = await walkMarkdown(PAGES_DIR);
  const errors = [];
  const sectionCounts = Object.fromEntries(Object.keys(SECTION_RULES).map((k) => [k, 0]));

  for (const filePath of files) {
    const relativePath = path.relative(ROOT, filePath).replaceAll("\\", "/");
    const section = getSection(relativePath);
    if (!section) {
      continue;
    }

    sectionCounts[section] += 1;

    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);

    for (const field of SECTION_RULES[section].required) {
      if (parsed.data[field] === undefined || parsed.data[field] === null || parsed.data[field] === "") {
        errors.push(`${relativePath}: missing required field "${field}"`);
      }
    }

    checkStyle(parsed.content, relativePath, errors);
    for (const [key, value] of Object.entries(parsed.data)) {
      if (typeof value === "string") {
        checkStyle(value, `${relativePath}#${key}`, errors);
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") {
            checkStyle(item, `${relativePath}#${key}`, errors);
          }
        }
      }
    }
  }

  if (sectionCounts.projects !== 12) {
    errors.push(`projects: expected 12 markdown files, found ${sectionCounts.projects}`);
  }

  for (const section of ["about", "works", "studies", "certificates", "contact"]) {
    if (sectionCounts[section] < 1) {
      errors.push(`${section}: expected at least one markdown file`);
    }
  }

  if (errors.length > 0) {
    console.error("Content validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Content validation passed.");
  for (const [section, count] of Object.entries(sectionCounts)) {
    console.log(`- ${section}: ${count} files`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
