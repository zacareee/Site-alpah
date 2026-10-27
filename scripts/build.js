// Fetches every feed once and writes public/news.json, for static hosting (e.g. GitHub Pages).
const fs = require('fs');
const path = require('path');
const { aggregate } = require('../lib/aggregate');

aggregate().then((data) => {
  const out = path.join(__dirname, '..', 'public', 'news.json');
  fs.writeFileSync(out, JSON.stringify(data));
  for (const s of data.sources) console.log(`${s.ok ? '✓' : '✗'} ${s.name}${s.ok ? ` (${s.count})` : ` — ${s.error}`}`);
  console.log(`Wrote ${data.items.length} articles to ${path.relative(process.cwd(), out)}`);
  if (!data.sources.some((s) => s.ok)) process.exit(1);
});
