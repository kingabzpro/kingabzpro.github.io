# Abid Ali Awan Portfolio

Astro based portfolio site migrated from Hugo Toha to a customized `astro-cv-esquelete` structure.

## Stack

- Astro 5
- Tailwind CSS + daisyUI
- Astro Icon
- Playwright CLI smoke testing

## Commands

```bash
npm install
npm run dev
npm run test:content
npm run test:ui
npm run build
```

## Image Generation

Generate favicon and website art with OpenAI Images API:

```bash
OPENAI_API_KEY=your_key npm run generate:images
```

Generated files:

- `src/assets/generated/favicon-master.png`
- `src/assets/generated/og-master.png`
- `public/favicon.png`
- `public/og-image.png`
- `public/background-texture.png`
- `public/project-placeholder.png`

## Deployment

GitHub Actions builds from branch `source` and publishes static output from `dist/` to branch `main` for GitHub Pages.
