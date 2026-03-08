import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, "src", "assets", "generated");
const PUBLIC_DIR = path.join(ROOT, "public");

const prompts = {
  favicon:
    "Minimal geometric monogram logo featuring the letter A. Clean vector style, high contrast, neutral background, sharp edges, no text besides the monogram.",
  og:
    "Modern abstract data and AI themed banner background with geometric shapes, subtle depth, slate and blue tones, clean professional style, no text.",
  background:
    "Subtle abstract texture for a portfolio website background. Soft geometric gradients, low contrast, calm professional look, no text.",
  placeholder:
    "Minimal project card illustration with geometric blocks and code inspired motifs. Clean, modern, neutral palette, no text."
};

async function generateImage(openai, prompt, size) {
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image API response did not include b64 data.");
  }
  return Buffer.from(b64, "base64");
}

async function ensureDirs() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  await ensureDirs();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const faviconRaw = await generateImage(openai, prompts.favicon, "1024x1024");
  const ogRaw = await generateImage(openai, prompts.og, "1536x1024");
  const bgRaw = await generateImage(openai, prompts.background, "1536x1024");
  const placeholderRaw = await generateImage(openai, prompts.placeholder, "1024x1024");

  const faviconMasterPath = path.join(GENERATED_DIR, "favicon-master.png");
  const ogMasterPath = path.join(GENERATED_DIR, "og-master.png");
  const backgroundPath = path.join(PUBLIC_DIR, "background-texture.png");
  const placeholderPath = path.join(PUBLIC_DIR, "project-placeholder.png");

  await fs.writeFile(faviconMasterPath, faviconRaw);
  await fs.writeFile(ogMasterPath, ogRaw);

  await sharp(faviconRaw).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(PUBLIC_DIR, "favicon.png"));
  await sharp(ogRaw).resize(1200, 630, { fit: "cover", position: "attention" }).png({ compressionLevel: 9 }).toFile(path.join(PUBLIC_DIR, "og-image.png"));
  await sharp(bgRaw).resize(1920, 1080, { fit: "cover", position: "center" }).png({ compressionLevel: 9 }).toFile(backgroundPath);
  await sharp(placeholderRaw).resize(1200, 675, { fit: "cover", position: "attention" }).png({ compressionLevel: 9 }).toFile(placeholderPath);

  console.log("Generated images:");
  console.log(`- ${path.relative(ROOT, faviconMasterPath)}`);
  console.log(`- ${path.relative(ROOT, path.join(PUBLIC_DIR, "favicon.png"))}`);
  console.log(`- ${path.relative(ROOT, ogMasterPath)}`);
  console.log(`- ${path.relative(ROOT, path.join(PUBLIC_DIR, "og-image.png"))}`);
  console.log(`- ${path.relative(ROOT, backgroundPath)}`);
  console.log(`- ${path.relative(ROOT, placeholderPath)}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
