// Tiny dependency-free RSS 2.0 / Atom parser. Good enough for news feeds, not a full XML parser.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

function decodeEntities(str) {
  return str.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

function unwrapCdata(str) {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
}

function clean(str) {
  if (!str) return '';
  const unwrapped = unwrapCdata(str);
  // Feeds often double-escape HTML in descriptions, so decode, strip, decode again.
  return decodeEntities(stripTags(decodeEntities(stripTags(unwrapped)))).replace(/\s+/g, ' ').trim();
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function tagContent(xml, name) {
  const m = xml.match(new RegExp(`<${escapeRe(name)}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapeRe(name)}>`, 'i'));
  return m ? m[1] : '';
}

function allTagContents(xml, name) {
  const re = new RegExp(`<${escapeRe(name)}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapeRe(name)}>`, 'gi');
  return [...xml.matchAll(re)].map((m) => m[1]);
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${escapeRe(name)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return m ? decodeEntities(m[2]) : '';
}

function findImage(block, rawDescription) {
  for (const name of ['media:content', 'media:thumbnail', 'enclosure']) {
    for (const tag of block.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || []) {
      const url = attr(tag, 'url');
      const type = attr(tag, 'type') || attr(tag, 'medium');
      if (url && (!type || /image/i.test(type) || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url))) return url;
    }
  }
  const html = decodeEntities(unwrapCdata(rawDescription + tagContent(block, 'content:encoded')));
  const img = html.match(/<img\b[^>]*>/i);
  return img ? attr(img[0], 'src') : '';
}

function safeUrl(url) {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

function toIso(dateStr) {
  const d = new Date(clean(dateStr));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max).replace(/\s+\S*$/, '') + '…' : str;
}

function parseFeed(xml) {
  const items = [];
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = isAtom ? allTagContents(xml, 'entry') : allTagContents(xml, 'item');

  for (const block of blocks) {
    let link;
    if (isAtom) {
      const links = block.match(/<link\b[^>]*>/gi) || [];
      const alt = links.find((l) => !/rel=/i.test(l) || /rel=["']alternate["']/i.test(l)) || links[0] || '';
      link = attr(alt, 'href');
    } else {
      link = clean(tagContent(block, 'link')) || clean(tagContent(block, 'guid'));
    }
    const rawDescription = tagContent(block, isAtom ? 'summary' : 'description') || tagContent(block, 'content');
    const item = {
      title: clean(tagContent(block, 'title')),
      link: safeUrl(link),
      date: toIso(tagContent(block, isAtom ? 'updated' : 'pubDate') || tagContent(block, 'published') || tagContent(block, 'dc:date')),
      summary: truncate(clean(rawDescription), 280),
      image: safeUrl(findImage(block, rawDescription)),
      categories: allTagContents(block, 'category').map(clean).filter(Boolean),
    };
    if (isAtom) {
      for (const tag of block.match(/<category\b[^>]*>/gi) || []) {
        const term = attr(tag, 'term');
        if (term) item.categories.push(term);
      }
    }
    if (item.title && item.link) items.push(item);
  }
  return items;
}

module.exports = { parseFeed, clean, decodeEntities };
