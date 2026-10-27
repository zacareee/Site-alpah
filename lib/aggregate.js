const { parseFeed } = require('./parse');
const defaultFeeds = require('../feeds');

const MANGA_RE = /\b(manga|manhwa|manhua|light novels?|webtoons?|shonen jump|weekly shōnen|tankōbon|volume \d+|chapter \d+|serialization|one-shot)\b/i;
const ANIME_RE = /\b(anime|tv anime|episode|season \d+|trailer|teaser|crunchyroll|simulcast|ova|film|movie|studio|voice cast|dub|opening theme|pv)\b/i;

// Tag each article as anime, manga, or both based on its text and the source's default.
function classify(item, source) {
  const text = `${item.title} ${item.categories.join(' ')} ${item.summary}`;
  const topics = new Set();
  if (MANGA_RE.test(text)) topics.add('manga');
  if (ANIME_RE.test(text)) topics.add('anime');
  if (topics.size === 0) topics.add(source.kind);
  return [...topics];
}

async function fetchFeed(source, timeoutMs = 15000) {
  const res = await fetch(source.url, {
    headers: { 'User-Agent': 'OtakuWire/1.0 (+news aggregator)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseFeed(await res.text()).map((item) => ({
    ...item,
    source: source.name,
    sourceSite: source.site,
    topics: classify(item, source),
  }));
}

function normalizeKey(item) {
  try {
    const u = new URL(item.link);
    return (u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '')).toLowerCase();
  } catch {
    return item.link;
  }
}

async function aggregate(feeds = defaultFeeds, { limitPerFeed = 40 } = {}) {
  const results = await Promise.allSettled(feeds.map((f) => fetchFeed(f)));
  const seen = new Map();
  const status = [];

  results.forEach((r, i) => {
    const source = feeds[i];
    if (r.status === 'rejected') {
      status.push({ name: source.name, ok: false, error: String(r.reason?.message || r.reason) });
      return;
    }
    status.push({ name: source.name, ok: true, count: r.value.length });
    for (const item of r.value.slice(0, limitPerFeed)) {
      const key = normalizeKey(item);
      const existing = seen.get(key);
      if (existing) {
        existing.topics = [...new Set([...existing.topics, ...item.topics])];
      } else {
        seen.set(key, item);
      }
    }
  });

  const items = [...seen.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return { updated: new Date().toISOString(), sources: status, items };
}

module.exports = { aggregate, classify, fetchFeed };
