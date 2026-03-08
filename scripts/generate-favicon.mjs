import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "public");
const sourceImagePath = path.join(rootDir, "src", "assets", "profile.png");

await mkdir(outputDir, { recursive: true });

const maskSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <circle cx="128" cy="128" r="118" fill="white"/>
</svg>
`);

const avatarBuffer = await sharp(sourceImagePath)
  .resize(256, 256, { fit: "cover", position: "attention" })
  .grayscale()
  .modulate({ brightness: 1.02 })
  .composite([{ input: maskSvg, blend: "dest-in" }])
  .png()
  .toBuffer();

const avatarDataUri = `data:image/png;base64,${avatarBuffer.toString("base64")}`;

const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Abid Ali Awan favicon">
  <image href="${avatarDataUri}" x="0" y="0" width="256" height="256"/>
</svg>
`.trim();

await writeFile(path.join(outputDir, "favicon.svg"), faviconSvg, "utf8");

await sharp(avatarBuffer)
  .resize(64, 64)
  .png()
  .toFile(path.join(outputDir, "favicon.png"));

await sharp(avatarBuffer)
  .resize(180, 180)
  .png()
  .toFile(path.join(outputDir, "apple-touch-icon.png"));

console.log("Generated grayscale circular favicon assets in public/");
