# Abid Ali Awan Portfolio

Personal portfolio and CV site built with Astro.

## Overview

- Static site output with Astro 5
- CV sections driven by markdown files
- Tailwind CSS and daisyUI for styling
- GitHub Pages deployment
- SEO focused single canonical page strategy

## Tech Stack

- Astro
- Tailwind CSS
- daisyUI
- Astro Icon
- sharp

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

## SEO Strategy

- Canonical index target: `https://abidaliawan.com/`
- Single-file sitemap at `public/sitemap.xml`
- Crawl control via [`public/robots.txt`](public/robots.txt) to block thin utility/content routes

Sitemap file is copied during build and published as:

- `https://abidaliawan.com/sitemap.xml`

## Favicon Generation

Generate favicon assets from `src/assets/profile.png`:

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
