# Zed's Log 🏴‍☠️

Anime & manga news, charted by [@mugiwara_no_Zed](https://x.com/mugiwara_no_Zed).

A simple website that aggregates **anime and manga news** from around the web into one fast, searchable feed.

- Pulls RSS/Atom feeds from Anime News Network, Crunchyroll News, MyAnimeList, Anime Corner, Otaku USA, Anime Herald, Anime UK News, Sakugabooru, CBR and The Beat
- Auto-tags every story as **anime**, **manga**, or both
- Search (press `/`), topic tabs, per-source toggles, and ★ Treasure — saved articles, stored in your browser
- De-duplicates stories, sorts newest first, works on mobile, light & dark mode
- Zero dependencies — just Node.js 18+

## Run it locally

```bash
npm start            # http://localhost:3000
```

The server fetches all feeds, caches them for 10 minutes, and serves the site. Add `?refresh` to `/news.json` to force a refetch.

## Host it for free on GitHub Pages

1. Push to `main`.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

The included workflow (`.github/workflows/pages.yml`) runs `npm run build` every hour, which writes `public/news.json`, and deploys the `public/` folder.

## Add or remove sources

Edit [`feeds.js`](feeds.js). Each entry needs a `name`, a feed `url`, a default `kind` (`anime` or `manga`), and a `site` link.

## Tests

```bash
npm test
```
