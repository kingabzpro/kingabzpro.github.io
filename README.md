# Abid Ali Awan Portfolio

Personal portfolio and CV site built with Astro.

## Overview

- Static site output with Astro 5
- CV sections driven by markdown files
- Tailwind CSS and daisyUI for styling
- GitHub Pages deployment

## Tech Stack

- Astro
- Tailwind CSS
- daisyUI
- Astro Icon
- sharp
- Playwright CLI scripts

## Quick Start

```bash
npm install
npm run dev
```

Local dev server runs at `http://localhost:4321`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test:content
npm run test:ui
npm run generate:images
npm run generate:favicon
```

## Content Structure

Main content lives in:

- `src/pages/about/about.md`
- `src/pages/works/*.md`
- `src/pages/studies/*.md`
- `src/pages/projects/*.md`
- `src/pages/certificates/*.md`
- `src/pages/contact/*.md`

## Image Generation

Generate OpenAI based image assets:

```bash
OPENAI_API_KEY=your_key npm run generate:images
```

Generate favicon assets:

```bash
npm run generate:favicon
```

Generated favicon files:

- `public/favicon.svg`
- `public/favicon.png`
- `public/apple-touch-icon.png`

## Deployment

GitHub Actions builds from branch `source` and publishes `dist/` to branch `main` for GitHub Pages.

## Credits

- Original Astro theme: [`astro-cv-esquelete`](https://github.com/mmouzo/astro-cv-esquelete)
- Original theme creator: [@mmouzo](https://github.com/mmouzo)
- Legacy source before migration: Hugo + Toha theme (stored in `legacy/hugo`)
