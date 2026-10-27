const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseFeed } = require('../lib/parse');
const { classify } = require('../lib/aggregate');

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

test('parses RSS 2.0 items with CDATA, entities and images', () => {
  const items = parseFeed(fixture('rss.xml'));
  assert.strictEqual(items.length, 2);
  const [a, b] = items;
  assert.strictEqual(a.title, 'Frieren Season 2 Gets January Premiere & New Trailer');
  assert.strictEqual(a.link, 'https://example.com/news/frieren-s2');
  assert.strictEqual(a.date, '2026-10-26T14:30:00.000Z');
  assert.strictEqual(a.image, 'https://example.com/img/frieren.jpg');
  assert.strictEqual(a.summary, 'The anime returns with a new PV — “Journey’s End” arc.');
  assert.deepStrictEqual(a.categories, ['Anime']);
  assert.strictEqual(b.image, 'https://example.com/img/chainsaw.png');
  assert.strictEqual(b.summary, 'Volume 20 ships next month.');
});

test('parses Atom entries', () => {
  const items = parseFeed(fixture('atom.xml'));
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].title, 'One Piece manga goes on break');
  assert.strictEqual(items[0].link, 'https://example.org/one-piece-break');
  assert.strictEqual(items[0].date, '2026-10-25T08:00:00.000Z');
  assert.deepStrictEqual(items[0].categories, ['Manga']);
});

test('drops items with non-http links', () => {
  const xml = '<rss><channel><item><title>Bad</title><link>javascript:alert(1)</link></item></channel></rss>';
  assert.strictEqual(parseFeed(xml).length, 0);
});

test('classifies topics', () => {
  const base = { categories: [], summary: '' };
  assert.deepStrictEqual(classify({ ...base, title: 'Chainsaw Man manga volume 20' }, { kind: 'anime' }), ['manga']);
  assert.deepStrictEqual(classify({ ...base, title: 'New anime trailer drops' }, { kind: 'manga' }), ['anime']);
  assert.deepStrictEqual(classify({ ...base, title: 'Industry interview' }, { kind: 'manga' }), ['manga']);
  assert.deepStrictEqual(classify({ ...base, title: 'Manga gets TV anime adaptation' }, { kind: 'anime' }).sort(), ['anime', 'manga']);
});
