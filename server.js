const http = require('http');
const fs = require('fs');
const path = require('path');
const { aggregate } = require('./lib/aggregate');

const PORT = process.env.PORT || 3000;
const CACHE_MS = 10 * 60 * 1000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

let cache = null;
let inflight = null;

async function getNews(force = false) {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  if (!inflight) {
    inflight = aggregate()
      .then((data) => {
        cache = { at: Date.now(), data };
        return data;
      })
      .finally(() => (inflight = null));
  }
  return inflight;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/news' || url.pathname === '/news.json') {
    try {
      const data = await getNews(url.searchParams.has('refresh'));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  const filePath = path.join(PUBLIC_DIR, path.normalize(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(filePath, (err, body) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  });
});

server.listen(PORT, () => {
  console.log(`OtakuWire running at http://localhost:${PORT}`);
  getNews().catch((err) => console.error('Initial fetch failed:', err.message));
});
