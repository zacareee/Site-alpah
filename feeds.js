// News sources. `kind` is the default topic when an article doesn't make it obvious.
module.exports = [
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us', kind: 'anime', site: 'https://www.animenewsnetwork.com' },
  { name: 'Crunchyroll News', url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss', kind: 'anime', site: 'https://www.crunchyroll.com/news' },
  { name: 'MyAnimeList', url: 'https://myanimelist.net/rss/news.xml', kind: 'anime', site: 'https://myanimelist.net/news' },
  { name: 'Anime Corner', url: 'https://animecorner.me/feed/', kind: 'anime', site: 'https://animecorner.me' },
  { name: 'Otaku USA', url: 'https://otakuusamagazine.com/feed/', kind: 'anime', site: 'https://otakuusamagazine.com' },
  { name: 'Anime Herald', url: 'https://www.animeherald.com/feed/', kind: 'anime', site: 'https://www.animeherald.com' },
  { name: 'Anime UK News', url: 'https://animeuknews.net/feed/', kind: 'anime', site: 'https://animeuknews.net' },
  { name: 'Sakugabooru Blog', url: 'https://blog.sakugabooru.com/feed/', kind: 'anime', site: 'https://blog.sakugabooru.com' },
  { name: 'CBR Anime', url: 'https://www.cbr.com/feed/category/anime/', kind: 'anime', site: 'https://www.cbr.com/category/anime/' },
  { name: 'The Beat (Manga)', url: 'https://www.comicsbeat.com/category/manga/feed/', kind: 'manga', site: 'https://www.comicsbeat.com/category/manga/' },
  { name: 'Anime News Network (Manga)', url: 'https://www.animenewsnetwork.com/news/rss.xml?ann-edition=us&tag=manga', kind: 'manga', site: 'https://www.animenewsnetwork.com' },
];
