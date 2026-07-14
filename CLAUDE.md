# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working with this

A single-page, no-build React app: an "honest inventory" showcase of every public site Real Minds AI has shipped. There is no bundler, package.json, or install step. React 18, ReactDOM, and Babel Standalone are loaded from unpkg CDNs in `index.html`; the `.jsx` files are transpiled in the browser via `<script type="text/babel">`.

```bash
# Serve locally (any static server works — Babel transpiles in-browser)
python3 -m http.server 8000   # then open http://localhost:8000
```

Deployment is just static-file hosting. `index.html` bumps cache-busting query strings (`page.css?v=3`) by hand when CSS changes.

## Contents

| File | Role |
|------|------|
| `index.html` | Entry point. Loads CDN React/Babel, then `data.js`, `tweaks-panel.jsx`, `app.jsx` in order. |
| `data.js` | All content. Sets `window.SHOWCASE_DATA` — the project inventory. Edit this to add/change showcased sites. |
| `app.jsx` | The app: `GridView` of project cards (framed as browser windows), an `Overlay` detail view, mount via `ReactDOM.createRoot`. |
| `tweaks-panel.jsx` | Reusable `TweaksPanel` shell + form controls (`useTweaks`, `TweakToggle`, `TweakSection`). Owns the host edit-mode postMessage protocol. |
| `page.css` | Main stylesheet. |
| `colors_and_type.css` | Color tokens + type scale (light-only; `#FAFAFA` bg, `#1A1B25` text). |
| `assets/previews/*.webp` | Pre-rendered slow-animated card previews, one per project `id`. |
| `assets/purple_circles_motif.svg` | Background motif. |
| `docs/superpowers/specs/2026-04-28-rmai-public-sites-inventory.md` | Source spec — the long-form inventory `data.js` was built from. |
| `RMAI showcase.zip` | Snapshot archive (gitignored content; the zip itself is tracked). |

`docs/superpowers/` is gitignored as a Claude install artifact.

## Data model

`window.SHOWCASE_DATA = { groups: [...] }`. Each group has `id`, `label`, `blurb`, and `projects[]`. The four groups are `live` (custom domain), `ghpages` (github.io), `tools`, and `academic` — 15 projects total.

Each project carries `id` (must match its `assets/previews/<id>.webp`), `name`, `subtitle`, `url`, `repo`, `year`, `sector`, `stack[]`, `status`, `summary`, `for`, `why`, and optional flags: `featured`, `appUrl`, `noEmbed`, `clientDomain`, `repoPrivate`.

## Previews

Cards default to the static animated WebP (`PreviewAnimated`). The Tweaks panel exposes a "Live iframe previews" toggle that swaps in `PreviewIframe` (live, sandboxed `<iframe>` of the real site) instead. Sites flagged `noEmbed` fall back rather than iframe.
